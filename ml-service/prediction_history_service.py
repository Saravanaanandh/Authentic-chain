import uuid
import logging
from datetime import datetime, timezone
from db_config import prediction_history

logger = logging.getLogger("prediction_history_service")

def save_prediction_history(
    profile_data: dict,
    prediction_result: dict,
    blockchain_hash: str = "",
    cloudinary_image_url: str = ""
) -> str:
    """
    Saves complete prediction details into prediction_history MongoDB collection.
    
    Expected profile_data dict keys:
      username, platform, bio, followers, following, posts, verified, profileImageUrl
      
    Expected prediction_result dict keys:
      finalPrediction, confidenceScore, fakeProbability, reasons, tabularScore, etc.
    """
    try:
        prediction_id = str(uuid.uuid4())
        
        # Build profile features dict matching exact tabular representation
        profile_features = {
            "platform": profile_data.get("platform", "instagram"),
            "followers": int(profile_data.get("followers", 0)),
            "following": int(profile_data.get("following", 0)),
            "posts": int(profile_data.get("posts", 0)),
            "verified": bool(profile_data.get("verified", False)),
            "bio": str(profile_data.get("bio", "")),
            "profileImageUrl": str(profile_data.get("profileImageUrl", ""))
        }
        
        models_used = [
            "Decision Tree Classifier",
            "Random Forest Classifier",
            "Naive Bayes Classifier",
            "XGBoost Classifier",
            "LightGBM Classifier",
            "Isolation Forest Anomaly Detector"
        ]

        doc = {
            "predictionId": prediction_id,
            "username": profile_data.get("username", "unknown"),
            "profileFeatures": profile_features,
            "prediction": prediction_result.get("finalPrediction", "UNKNOWN"),
            "confidence": float(prediction_result.get("confidenceScore", 0.0)),
            "riskScore": float(prediction_result.get("fakeProbability", 0.0)),
            "modelsUsed": models_used,
            "predictionTimestamp": datetime.now(timezone.utc),
            "blockchainHash": blockchain_hash,
            "cloudinaryImageUrl": cloudinary_image_url or profile_data.get("profileImageUrl", ""),
            "feedbackStatus": "pending"  # "pending", "correct", or "incorrect"
        }

        prediction_history.insert_one(doc)
        logger.info(f"Saved prediction history record {prediction_id} for user '{profile_data.get('username')}'")
        return prediction_id

    except Exception as e:
        logger.error(f"Failed to save prediction history: {e}")
        return ""
