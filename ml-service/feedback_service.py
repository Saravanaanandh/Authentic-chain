import hashlib
import logging
from datetime import datetime, timezone
from pymongo import UpdateOne
from db_config import feedback_data, training_data, prediction_history
from ensemble import ml_service

logger = logging.getLogger("feedback_service")

class ProfileDummy:
    """Wrapper to pass dict features to ml_service.extract_tabular_features."""
    def __init__(self, data: dict):
        self.username = str(data.get("username", ""))
        self.bio = str(data.get("bio", ""))
        self.followers = int(data.get("followers", 0))
        self.following = int(data.get("following", data.get("follows", 0)))
        self.posts = int(data.get("posts", 0))
        self.verified = bool(data.get("verified", False))
        self.profileImageUrl = str(data.get("profileImageUrl", data.get("profilePicUrl", "")))

def extract_features_dict(profile_dict: dict) -> dict:
    """
    Uses existing MLService.extract_tabular_features logic to extract the exact
    11 tabular features expected by training_data.
    """
    dummy = ProfileDummy(profile_dict)
    df = ml_service.extract_tabular_features(dummy)
    row = df.iloc[0].to_dict()
    return row

def compute_tabular_hash(features_dict: dict, label: int) -> str:
    """Computes SHA-256 profile hash for deduplication in training_data."""
    feature_str = (
        f"{features_dict['profile pic']}|{features_dict['nums/length username']}|{features_dict['fullname words']}|"
        f"{features_dict['nums/length fullname']}|{features_dict['name==username']}|{features_dict['description length']}|"
        f"{features_dict['external URL']}|{features_dict['private']}|{features_dict['#posts']}|{features_dict['#followers']}|"
        f"{features_dict['#follows']}|{label}"
    )
    return hashlib.sha256(feature_str.encode('utf-8')).hexdigest()

def process_user_feedback(feedback_payload: dict) -> dict:
    """
    Processes user feedback:
    1. Saves entry to feedback_data collection.
    2. Automatically appends/upserts verified profile features into training_data.
    3. Updates prediction_history feedbackStatus.
    """
    try:
        username = feedback_payload.get("username", "unknown")
        original_pred = feedback_payload.get("originalPrediction", "REAL")
        original_prob = float(feedback_payload.get("originalFakeProbability", 50.0))
        user_label_str = feedback_payload.get("userCorrectedLabel", "").strip()
        is_correct = feedback_payload.get("isCorrect", None)
        
        # Determine correction status
        if is_correct is True or user_label_str.upper() == original_pred.upper():
            is_correct_feedback = True
            final_label_str = original_pred
        else:
            is_correct_feedback = False
            final_label_str = user_label_str

        # Convert label string ("FAKE", "HIGHLY FAKE", "Real", "Fake", etc.) to binary int (0 or 1)
        fake_binary = 1 if "FAKE" in final_label_str.upper() else 0

        # Snapshot features
        snapshot = feedback_payload.get("profileSnapshot") or feedback_payload.get("profileFeatures") or {}
        if not snapshot:
            snapshot = {
                "username": username,
                "followers": feedback_payload.get("followers", 0),
                "following": feedback_payload.get("following", 0),
                "posts": feedback_payload.get("posts", 0),
                "bio": feedback_payload.get("bio", ""),
                "profileImageUrl": feedback_payload.get("profileImageUrl", "")
            }

        # 1. Save to feedback_data collection
        feedback_doc = {
            "username": username,
            "sourcePlatform": feedback_payload.get("sourcePlatform", "instagram"),
            "originalPrediction": original_pred,
            "originalFakeProbability": original_prob,
            "userCorrectedLabel": final_label_str,
            "isCorrect": is_correct_feedback,
            "feedbackReason": feedback_payload.get("feedbackReason", "User feedback submitted"),
            "notes": feedback_payload.get("notes", ""),
            "profileSnapshot": snapshot,
            "submittedBy": feedback_payload.get("submittedBy", "anonymous"),
            "source": "user_feedback",
            "verified": True,
            "createdAt": datetime.now(timezone.utc)
        }
        fb_result = feedback_data.insert_one(feedback_doc)
        logger.info(f"Saved user feedback {fb_result.inserted_id} for '{username}'")

        # 2. Extract tabular features and append into training_data
        tabular_features = extract_features_dict(snapshot)
        profile_hash = compute_tabular_hash(tabular_features, fake_binary)

        training_doc = {
            **tabular_features,
            "fake": fake_binary,
            "username": username,
            "profileHash": profile_hash,
            "source": "user_feedback",
            "verified": True,
            "createdAt": datetime.now(timezone.utc)
        }

        # Upsert into training_data (Step 7: Automatic Training Data Update)
        train_result = training_data.update_one(
            {"profileHash": profile_hash},
            {"$set": training_doc},
            upsert=True
        )
        if train_result.upserted_id:
            logger.info(f"Automatically inserted new verified feedback record into training_data for '{username}'")
        else:
            logger.info(f"Updated existing training record with verified feedback for '{username}'")

        # 3. Update prediction_history if predictionId or username provided
        pred_id = feedback_payload.get("predictionId")
        if pred_id:
            prediction_history.update_one(
                {"predictionId": pred_id},
                {"$set": {"feedbackStatus": "correct" if is_correct_feedback else "incorrect"}}
            )
        else:
            prediction_history.update_many(
                {"username": username, "feedbackStatus": "pending"},
                {"$set": {"feedbackStatus": "correct" if is_correct_feedback else "incorrect"}}
            )

        return {
            "success": True,
            "feedbackId": str(fb_result.inserted_id),
            "trainingRecordAdded": True,
            "finalLabel": final_label_str,
            "fakeBinary": fake_binary
        }

    except Exception as e:
        logger.error(f"Error processing feedback: {e}")
        return {"success": False, "error": str(e)}
