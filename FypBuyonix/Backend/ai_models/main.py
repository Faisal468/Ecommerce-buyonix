from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
import pickle
import os
import base64
import io

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Model path: same folder as this file ──────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "cf_model.pkl")

cf_model = None
vs_model = None

# Load existing model on startup
try:
    with open(MODEL_PATH, "rb") as f:
        cf_model = pickle.load(f)
    # If saved as CollaborativeFilteringModel object, convert to dict
    if hasattr(cf_model, "__dict__") and not isinstance(cf_model, dict):
        cf_model = cf_model.__dict__
    print(f"CF Model loaded from {MODEL_PATH}")
except Exception as e:
    print(f"CF Model not loaded: {e}")


# ── MongoDB helper ─────────────────────────────────────────────────────────────
async def fetch_mongo_interactions():
    mongo_uri = os.environ.get("MONGO_URI", "")
    if not mongo_uri:
        print("⚠️  MONGO_URI not set — cannot fetch interactions from DB")
        return []
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=8000)
        db = client.get_default_database()
        cursor = db["interactions"].find({}, {"userId": 1, "productId": 1, "rating": 1, "weight": 1})
        interactions = []
        async for doc in cursor:
            interactions.append({
                "userId": str(doc["userId"]),
                "productId": str(doc["productId"]),
                "rating": doc.get("rating") or min((doc.get("weight", 1)) / 2, 5),
            })
        client.close()
        print(f"📦 Fetched {len(interactions)} interactions from MongoDB")
        return interactions
    except Exception as e:
        print(f"❌ MongoDB fetch error: {e}")
        return []


# ── Train helper (no dependency on collaborative_filtering.py) ─────────────────
def train_from_interactions(interactions):
    import pandas as pd
    from sklearn.decomposition import TruncatedSVD
    from scipy.sparse import csr_matrix

    df = pd.DataFrame(interactions)
    df = df.rename(columns={"userId": "user_id", "productId": "product_id", "rating": "rating"})
    df = df[["user_id", "product_id", "rating"]].drop_duplicates(subset=["user_id", "product_id"], keep="last")

    user_ids = list(df["user_id"].unique())
    product_ids = list(df["product_id"].unique())
    user_idx = {u: i for i, u in enumerate(user_ids)}
    prod_idx = {p: i for i, p in enumerate(product_ids)}

    rows = df["user_id"].map(user_idx)
    cols = df["product_id"].map(prod_idx)
    vals = df["rating"].astype(float)

    matrix = csr_matrix((vals, (rows, cols)), shape=(len(user_ids), len(product_ids)))
    n_factors = max(min(10, len(user_ids) - 1, len(product_ids) - 1), 1)

    svd = TruncatedSVD(n_components=n_factors, random_state=42)
    svd.fit(matrix)

    return {
        "svd_model": svd,
        "user_item_matrix": matrix,
        "user_ids": user_ids,
        "product_ids": product_ids,
    }


def save_cf_model(model_dict):
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_dict, f)
    print(f"✅ CF model saved to {MODEL_PATH}")


# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    global vs_model, cf_model

    # If no model loaded, fetch from MongoDB and train
    if cf_model is None:
        print("🔄 No saved model — fetching interactions from MongoDB...")
        interactions = await fetch_mongo_interactions()
        if len(interactions) >= 5:
            try:
                model_dict = train_from_interactions(interactions)
                save_cf_model(model_dict)
                cf_model = model_dict
                print(f"✅ CF model trained on startup with {len(interactions)} interactions")
            except Exception as e:
                print(f"❌ Startup training failed: {e}")
        else:
            print(f"⚠️  Only {len(interactions)} interactions found — need at least 5")

    # Load visual search model
    try:
        print("Loading TensorFlow MobileNetV2 for visual search...")
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
        os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
        import tensorflow as tf
        tf.get_logger().setLevel('ERROR')
        from tensorflow.keras.applications import MobileNetV2
        vs_model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')
        print("Visual search model loaded")
    except Exception as e:
        print(f"Could not load TensorFlow model: {e}")
        vs_model = None


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Buyonix AI API running!", "status": "healthy"}


@app.get("/health")
def health():
    stats = {}
    if cf_model and isinstance(cf_model, dict):
        stats = {
            "n_users": len(cf_model.get("user_ids", [])),
            "n_products": len(cf_model.get("product_ids", [])),
        }
    return {
        "success": True,
        "status": "healthy",
        "cf_model": cf_model is not None,
        "vs_model": vs_model is not None,
        "stats": stats,
    }


@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: str, limit: int = 10):
    try:
        if cf_model is None:
            return {"recommendations": [], "message": "Model not loaded"}

        user_ids = cf_model.get("user_ids", [])
        product_ids = cf_model.get("product_ids", [])
        user_item_matrix = cf_model.get("user_item_matrix")
        svd_model = cf_model.get("svd_model")

        if user_id not in user_ids:
            return {"recommendations": [], "message": "User not found in model", "userId": user_id}

        import numpy as np

        user_idx = user_ids.index(user_id)

        user_factors = svd_model.transform(user_item_matrix)
        scores = user_factors[user_idx] @ svd_model.components_

        rated_mask = np.array(user_item_matrix[user_idx]).flatten() > 0
        scores[rated_mask] = -np.inf

        top_indices = np.argsort(scores)[::-1][:limit]

        recommendations = [
            {
                "product_id": str(product_ids[idx]),
                "predicted_rating": float(scores[idx])
            }
            for idx in top_indices
            if scores[idx] != -np.inf
        ]

        return {"recommendations": recommendations, "userId": user_id}

    except Exception as e:
        print(f"Recommendation error: {e}")
        return {"recommendations": [], "error": str(e)}


@app.post("/cf/train")
async def train_cf(request: Request):
    global cf_model
    try:
        data = await request.json()
        interactions = data.get("interactions", [])

        # If no interactions passed, fetch from MongoDB
        if not interactions:
            interactions = await fetch_mongo_interactions()

        if not interactions:
            return {"error": "No interactions provided"}

        print(f"🔄 Training CF model with {len(interactions)} interactions...")
        model_dict = train_from_interactions(interactions)
        save_cf_model(model_dict)
        cf_model = model_dict

        stats = {
            "n_users": len(model_dict["user_ids"]),
            "n_products": len(model_dict["product_ids"]),
        }
        print(f"✅ Model trained — {stats['n_users']} users, {stats['n_products']} products")
        return {"success": True, "stats": stats}

    except Exception as e:
        print(f"Training error: {e}")
        return {"error": str(e)}


@app.post("/extract")
async def extract_features(request: Request):
    if vs_model is None:
        return {"success": False, "error": "Visual search model not loaded"}
    try:
        import numpy as np
        from PIL import Image
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        from tensorflow.keras.preprocessing import image as keras_image

        data = await request.json()
        image_data = data.get("image") or data.get("imageUrl")

        if not image_data:
            return {"success": False, "error": "No image provided"}

        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))

        img_array = keras_image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        features = vs_model.predict(img_array, verbose=0)
        return {"success": True, "features": features.flatten().tolist()}

    except Exception as e:
        print(f"Feature extraction error: {e}")
        return {"success": False, "error": str(e)}


@app.post("/visual-search")
async def visual_search(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        return {"results": [], "message": "Visual search processing"}
    except Exception as e:
        return {"results": [], "error": str(e)}
