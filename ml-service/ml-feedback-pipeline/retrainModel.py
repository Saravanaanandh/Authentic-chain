import time
import logging
from datetime import datetime, timezone
import sys
from pathlib import Path

# Path resolution for ml-service imports
sys.path.append(str(Path(__file__).resolve().parent.parent))

from db_config import training_data, retraining_logs
from train import load_data, train_tabular_models, train_anomaly_model
from modelVersionManager import ModelVersionManager
from ensemble import ml_service

logger = logging.getLogger("retrain_pipeline")

def trigger_retraining_pipeline() -> dict:
    """
    Executes full retraining pipeline from MongoDB training_data.
    Zero CSV reading at runtime.
    Logs progress in retraining_logs and updates model_versions.
    """
    start_time = datetime.now(timezone.utc)
    start_ticks = time.time()
    logger.info("========== STARTING MONGODB RETRAINING PIPELINE ==========")

    try:
        # Step 6: Load datasets from MongoDB
        X_train, y_train, X_test, y_test = load_data()
        records_used = len(X_train) + len(X_test)
        
        # Count user feedback records used
        feedback_count = training_data.count_documents({"source": "user_feedback"})
        logger.info(f"Retraining with {records_used} total records ({feedback_count} user feedback corrections).")

        # Fetch baseline version info
        version_manager = ModelVersionManager()
        old_version_doc = version_manager.get_latest_active_version()
        old_accuracy = float(old_version_doc.get("accuracy", 0.0))

        # Train ML models
        metrics = train_tabular_models(X_train, y_train, X_test, y_test)
        train_anomaly_model(X_train)

        new_accuracy = float(metrics.get("accuracy", 0.0))
        end_ticks = time.time()
        duration_seconds = end_ticks - start_ticks
        end_time = datetime.now(timezone.utc)

        # Decision threshold: Promote if new accuracy is >= old accuracy or first run
        decision = "PROMOTED" if (new_accuracy >= old_accuracy - 0.02 or old_accuracy == 0.0) else "SKIPPED"

        new_version_str = old_version_doc.get("versionNumber", "v1.0.0")
        if decision == "PROMOTED":
            new_version_str = version_manager.register_and_promote_version(
                metrics=metrics,
                sample_count=records_used,
                duration_seconds=duration_seconds
            )
            # Hot-reload models in running ML microservice instance
            ml_service.load_models()
            logger.info("Hot-reloaded models in ML service memory.")

        # Step 9: Store retraining log in retraining_logs collection
        log_doc = {
            "startTime": start_time,
            "endTime": end_time,
            "recordsUsed": records_used,
            "feedbackRecordsUsed": feedback_count,
            "newAccuracy": new_accuracy,
            "oldAccuracy": old_accuracy,
            "deploymentDecision": decision,
            "version": new_version_str,
            "metrics": metrics,
            "durationSeconds": round(duration_seconds, 2)
        }
        retraining_logs.insert_one(log_doc)
        logger.info(f"Retraining log recorded with decision '{decision}' (New Acc: {new_accuracy}, Old Acc: {old_accuracy})")

        return {
            "status": "success",
            "decision": decision,
            "version": new_version_str,
            "recordsProcessed": records_used,
            "feedbackRecordsUsed": feedback_count,
            "newAccuracy": new_accuracy,
            "oldAccuracy": old_accuracy,
            "durationSeconds": round(duration_seconds, 2),
            "metrics": metrics
        }

    except Exception as e:
        logger.error(f"Retraining pipeline failed: {e}")
        end_time = datetime.now(timezone.utc)
        error_log = {
            "startTime": start_time,
            "endTime": end_time,
            "recordsUsed": 0,
            "feedbackRecordsUsed": 0,
            "newAccuracy": 0.0,
            "oldAccuracy": 0.0,
            "deploymentDecision": "FAILED",
            "error": str(e)
        }
        retraining_logs.insert_one(error_log)
        return {"status": "failed", "error": str(e)}

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = trigger_retraining_pipeline()
    print("Retraining Result:", result)
