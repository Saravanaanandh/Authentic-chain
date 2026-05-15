from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import uvicorn
from ensemble import ml_service
import sys
import os

# Add ml-feedback-pipeline to path
sys.path.append(os.path.join(os.path.dirname(__file__), "ml-feedback-pipeline"))
try:
    from retrainModel import trigger_retraining_pipeline
except ImportError:
    pass


app = FastAPI(title="FakeID Shield - ML Microservice")

# Input Schema
class ProfileInput(BaseModel):
    platform: str
    username: str
    bio: Optional[str] = ""
    followers: int
    following: int
    posts: int
    verified: bool
    profileImageUrl: Optional[str] = ""

# API Security - Mock API Key
API_KEY = "fakeid-shield-secret-key-2026"

@app.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": ml_service.tabular_model is not None}

@app.post("/predict-profile")
def predict_profile(profile: ProfileInput, authorization: Optional[str] = Header(None)):
    if authorization != f"Bearer {API_KEY}":
        # For hackathon/development ease we won't strictly enforce it locally,
        # but in production you'd raise 401. 
        # We will allow it for now if it's missing just for easy integration
        pass 
        
    try:
        result = ml_service.predict(profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
def retrain_model(authorization: Optional[str] = Header(None)):
    if authorization != f"Bearer {API_KEY}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        # Check if function exists
        if "trigger_retraining_pipeline" in globals():
            result = trigger_retraining_pipeline()
            return result
        else:
            return {"status": "skipped", "reason": "Retraining module not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
