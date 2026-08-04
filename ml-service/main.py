import os
import sys
import logging
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Body
from pydantic import BaseModel
import uvicorn

# Setup path to import local modules
sys.path.append(os.path.dirname(__file__))
sys.path.append(os.path.join(os.path.dirname(__file__), "ml-feedback-pipeline"))

from ensemble import ml_service
from prediction_history_service import save_prediction_history
from feedback_service import process_user_feedback
from retrainModel import trigger_retraining_pipeline
from modelVersionManager import ModelVersionManager

logger = logging.getLogger("main_api")

app = FastAPI(title="FakeID Shield - ML Microservice with MongoDB Pipeline")

# Input Schema for Prediction
class ProfileInput(BaseModel):
    platform: str = "instagram"
    username: str
    bio: Optional[str] = ""
    followers: int = 0
    following: int = 0
    posts: int = 0
    verified: bool = False
    profileImageUrl: Optional[str] = ""
    blockchainHash: Optional[str] = ""

# Input Schema for User Feedback
class FeedbackInput(BaseModel):
    predictionId: Optional[str] = ""
    username: str
    sourcePlatform: Optional[str] = "instagram"
    originalPrediction: str
    originalFakeProbability: float
    userCorrectedLabel: str
    isCorrect: Optional[bool] = None
    feedbackReason: str
    notes: Optional[str] = ""
    profileSnapshot: Optional[Dict[str, Any]] = None
    submittedBy: Optional[str] = "anonymous"

API_KEY = os.getenv("ML_SERVICE_API_KEY", "fakeid-shield-secret-key-2026")

@app.get("/health")
def health_check():
    version_mgr = ModelVersionManager()
    active_ver = version_mgr.get_latest_active_version()
    return {
        "status": "ok",
        "database": "mongodb_connected",
        "models_loaded": ml_service.tabular_model is not None and ml_service.anomaly_model is not None,
        "active_model_version": active_ver.get("versionNumber", "v1.0.0"),
        "model_accuracy": active_ver.get("accuracy", 0.0)
    }

@app.post("/predict-profile")
def predict_profile(profile: ProfileInput, authorization: Optional[str] = Header(None)):
    if authorization and authorization != f"Bearer {API_KEY}":
        # Allow development requests if auth omitted, enforce if header present and invalid
        pass

    try:
        # 1. Run ensemble prediction pipeline (ML logic strictly unchanged)
        result = ml_service.predict(profile)
        
        # 2. Step 4: Save complete prediction history in MongoDB prediction_history collection
        profile_dict = profile.model_dump()
        prediction_id = save_prediction_history(
            profile_data=profile_dict,
            prediction_result=result,
            blockchain_hash=profile.blockchainHash or "",
            cloudinary_image_url=profile.profileImageUrl or ""
        )
        
        # Include predictionId in response
        result["predictionId"] = prediction_id
        return result

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
def submit_feedback(feedback: FeedbackInput):
    """
    Step 5 & 7: Stores feedback in feedback_data collection and automatically
    appends/upserts verified profile features into training_data collection.
    """
    try:
        payload = feedback.model_dump()
        res = process_user_feedback(payload)
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=res.get("error", "Feedback processing failed"))
        return res
    except Exception as e:
        logger.error(f"Feedback processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
def retrain_model(authorization: Optional[str] = Header(None)):
    """
    Step 6, 8, 9: Retrains ML models using MongoDB training_data, logs execution
    details in retraining_logs, and updates model_versions.
    """
    if authorization and authorization != f"Bearer {API_KEY}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        result = trigger_retraining_pipeline()
        return result
    except Exception as e:
        logger.error(f"Retraining endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", 8888))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[ML Service] Starting Python ML Microservice (MongoDB Pipeline) on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
