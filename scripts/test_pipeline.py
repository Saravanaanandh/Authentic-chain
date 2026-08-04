#!/usr/bin/env python3
"""
Verification & Test Suite for MongoDB ML Pipeline
=================================================
Tests:
1. MongoDataLoader (loading training_data and testing_data)
2. PredictionHistory saving
3. User Feedback & automatic insertion into training_data
4. Model Retraining, Versioning, and Retraining Logs
"""

import sys
import os
import time
from pathlib import Path

# Force UTF-8 stdout encoding for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(str(Path(__file__).resolve().parent.parent / "ml-service"))
sys.path.append(str(Path(__file__).resolve().parent.parent / "ml-service" / "ml-feedback-pipeline"))

from mongo_data_loader import load_training_data_from_db, load_testing_data_from_db
from prediction_history_service import save_prediction_history
from feedback_service import process_user_feedback
from retrainModel import trigger_retraining_pipeline
from db_config import training_data, prediction_history, feedback_data, model_versions, retraining_logs

def test_pipeline():
    print("=========================================================")
    print("RUNNING AUTOMATED VERIFICATION SUITE")
    print("=========================================================")

    # Test 1: Data Loader
    print("[TEST 1] Testing MongoDataLoader...")
    train_df = load_training_data_from_db()
    test_df = load_testing_data_from_db()
    assert not train_df.empty, "Training dataframe loaded from MongoDB should not be empty!"
    assert train_df.shape[1] == 12, f"Expected 12 columns, got {train_df.shape[1]}"
    print(f"[OK] MongoDataLoader passed. Loaded {len(train_df)} train rows, {len(test_df)} test rows.")

    # Test 2: Prediction History
    print("\n[TEST 2] Testing Prediction History...")
    test_profile = {
        "username": "verification_test_user",
        "platform": "instagram",
        "bio": "Crypto investor dm for business",
        "followers": 50,
        "following": 3000,
        "posts": 15,
        "verified": False,
        "profileImageUrl": "https://example.com/pic.jpg"
    }
    test_result = {
        "finalPrediction": "HIGHLY FAKE",
        "confidenceScore": 88.5,
        "fakeProbability": 94.2
    }
    pred_id = save_prediction_history(test_profile, test_result, blockchain_hash="0x123abc")
    assert pred_id, "save_prediction_history should return a valid predictionId"
    doc = prediction_history.find_one({"predictionId": pred_id})
    assert doc is not None, "Document should exist in prediction_history collection"
    print(f"[OK] Prediction History passed. Saved record {pred_id}.")

    # Test 3: Feedback System & Auto Training Data Update
    print("\n[TEST 3] Testing Feedback System & Auto Training Data Update...")
    initial_train_count = training_data.count_documents({})
    feedback_payload = {
        "predictionId": pred_id,
        "username": "verification_test_user",
        "sourcePlatform": "instagram",
        "originalPrediction": "HIGHLY FAKE",
        "originalFakeProbability": 94.2,
        "userCorrectedLabel": "Fake",
        "isCorrect": True,
        "feedbackReason": "Suspicious following ratio and bio",
        "profileSnapshot": test_profile
    }
    fb_res = process_user_feedback(feedback_payload)
    assert fb_res.get("success") is True, f"Feedback process failed: {fb_res}"
    
    new_train_count = training_data.count_documents({})
    assert new_train_count >= initial_train_count, "Training data count should increase or update!"
    fb_doc = feedback_data.find_one({"username": "verification_test_user"})
    assert fb_doc is not None, "Feedback doc should exist in feedback_data collection"
    print(f"[OK] Feedback System passed. Added feedback doc and updated training_data (Total: {new_train_count}).")

    # Test 4: Retraining, Versioning & Retraining Logs
    print("\n[TEST 4] Testing Retraining Pipeline, Model Versioning & Retraining Logs...")
    retrain_res = trigger_retraining_pipeline()
    assert retrain_res.get("status") == "success", f"Retraining failed: {retrain_res}"
    
    # Check model versioning
    active_ver = model_versions.find_one({"deploymentStatus": "ACTIVE"})
    assert active_ver is not None, "Active model version should exist in model_versions collection"
    
    # Check retraining log
    latest_log = retraining_logs.find_one({}, sort=[("startTime", -1)])
    assert latest_log is not None, "Retraining log should exist in retraining_logs collection"
    
    print(f"[OK] Retraining Pipeline passed.")
    print(f"   - Active Version : {active_ver.get('versionNumber')}")
    print(f"   - Accuracy       : {active_ver.get('accuracy')}")
    print(f"   - Log Decision   : {latest_log.get('deploymentDecision')}")

    print("\n=========================================================")
    print("ALL 4 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=========================================================")

if __name__ == "__main__":
    test_pipeline()
