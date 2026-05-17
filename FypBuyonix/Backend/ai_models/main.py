from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
import pickle
import os
import base64
import io

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

cf_model = None
vs_model = None  # MobileNetV2 for visual search

try:
    with open("cf_model.pkl", "rb") as f:
        cf_model = pickle.load(f)
    print("CF Model loaded")
except Exception as e:
    print(f"CF Model not loaded: {e}")


@app.on_event("startup")
async def startup():
    global vs_model
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


@app.get("/")
def root():
    return {"message": "Buyonix AI API running!", "status": "healthy"}


@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy",
        "cf_model": cf_model is not None,
        "vs_model": vs_model is not None
    }


@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: str, limit: int = 10):
    try:
        if cf_model is None:
            return {"recommendations": [], "message": "Model not loaded"}

        # Call recommend_products() directly on the loaded model
        raw_recs = cf_model.recommend_products(
            user_id,
            n_recommendations=limit,
            exclude_rated=True
        )

        recommendations = [
            {
                "product_id": str(pid),
                "predicted_rating": float(rating)
            }
            for pid, rating in raw_recs
        ]

        return {"recommendations": recommendations, "userId": user_id}

    except Exception as e:
        print(f"Recommendation error: {e}")
        return {"recommendations": [], "error": str(e)}

@app.post("/cf/train")
async def train_cf(request: Request):
    try:
        import pandas as pd
        from collaborative_filtering import CollaborativeFilteringModel

        data = await request.json()
        interactions = data.get("interactions", [])

        if not interactions:
            return {"error": "No interactions provided"}

        df = pd.DataFrame(interactions)
        df = df.rename(columns={
            'userId': 'user_id',
            'productId': 'product_id',
            'rating': 'rating'
        })[['user_id', 'product_id', 'rating']]
        df = df.drop_duplicates(subset=['user_id', 'product_id'], keep='last')

        global cf_model
        cf_model = CollaborativeFilteringModel(n_factors=10)
        cf_model.train(df)
        cf_model.save_model("cf_model.pkl")

        stats = cf_model.get_model_stats()
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
