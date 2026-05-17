from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pickle

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

cf_model = None
try:
    with open("cf_model.pkl", "rb") as f:
        cf_model = pickle.load(f)
    print("CF Model loaded")
except Exception as e:
    print(f"CF Model not loaded: {e}")

@app.get("/")
def root():
    return {"message": "Buyonix AI API running!", "status": "healthy"}

@app.get("/health")
def health():
    return {"status": "healthy", "cf_model": cf_model is not None}

@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: str, limit: int = 10):
    try:
        if cf_model is None:
            return {"recommendations": [], "message": "Model not loaded"}
        return {"recommendations": [], "userId": user_id}
    except Exception as e:
        return {"recommendations": [], "error": str(e)}

@app.post("/visual-search")
async def visual_search(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        return {"results": [], "message": "Visual search processing"}
    except Exception as e:
        return {"results": [], "error": str(e)}
