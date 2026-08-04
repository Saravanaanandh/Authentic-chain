import logging
from datetime import datetime, timezone
import sys
from pathlib import Path

# Path resolution for db_config
sys.path.append(str(Path(__file__).resolve().parent.parent))

from db_config import model_versions

logger = logging.getLogger("modelVersionManager")

class ModelVersionManager:
    def __init__(self):
        pass

    def get_latest_active_version(self) -> dict:
        """Fetch current ACTIVE model version record from model_versions collection."""
        try:
            active_doc = model_versions.find_one({"deploymentStatus": "ACTIVE"}, sort=[("trainingDate", -1)])
            if active_doc:
                return active_doc
        except Exception as e:
            logger.error(f"Error fetching active version: {e}")
        
        return {
            "versionNumber": "v1.0.0",
            "accuracy": 0.9000,
            "deploymentStatus": "ACTIVE"
        }

    def register_and_promote_version(self, metrics: dict, sample_count: int, duration_seconds: float) -> str:
        """
        Registers a new model version in model_versions collection (Step 8)
        and promotes it to ACTIVE while archiving previous versions.
        """
        try:
            now = datetime.now(timezone.utc)
            version_str = f"v1.0.{now.strftime('%Y%m%d%H%M%S')}"

            # Step 8: Store in model_versions collection
            version_doc = {
                "versionNumber": version_str,
                "trainingDate": now,
                "trainingSampleCount": sample_count,
                "accuracy": metrics.get("accuracy", 0.0),
                "precision": metrics.get("precision", 0.0),
                "recall": metrics.get("recall", 0.0),
                "f1Score": metrics.get("f1Score", 0.0),
                "featureCount": 11,
                "trainingDuration": round(duration_seconds, 2),
                "deploymentStatus": "ACTIVE",
                "detailedMetrics": metrics
            }

            # Archive prior active versions
            model_versions.update_many(
                {"deploymentStatus": "ACTIVE"},
                {"$set": {"deploymentStatus": "ARCHIVED"}}
            )

            model_versions.insert_one(version_doc)
            logger.info(f"Successfully promoted new model version {version_str} to ACTIVE status.")
            return version_str

        except Exception as e:
            logger.error(f"Error promoting model version: {e}")
            return "v1.0.0-fallback"
