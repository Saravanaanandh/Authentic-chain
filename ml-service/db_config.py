import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("db_config")

# Find and load .env file from project root or current dir
env_path = Path(__file__).resolve().parent.parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).resolve().parent / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    logger.error("MONGODB_URI is not set in environment variables!")
    raise ValueError("MONGODB_URI missing from environment variables.")

# Global client singleton with connection pooling
client = MongoClient(MONGODB_URI, maxPoolSize=50, serverSelectionTimeoutMS=10000)

# Default Database
# Extract DB name from URI if specified, or default to authenticchaindb
db = client.get_default_database("authenticchaindb")

# Collection names matching database design requirement
training_data = db["training_data"]
testing_data = db["testing_data"]
feedback_data = db["feedback_data"]
prediction_history = db["prediction_history"]
retraining_logs = db["retraining_logs"]
model_versions = db["model_versions"]

def setup_database_indexes():
    """
    Creates necessary unique indexes to prevent data duplication
    and performance indexes for querying.
    """
    try:
        # Step 11: Prevent duplicate entries using unique profileHash index
        training_data.create_index([("profileHash", ASCENDING)], unique=True)
        training_data.create_index([("username", ASCENDING)])
        
        testing_data.create_index([("profileHash", ASCENDING)], unique=True)
        
        feedback_data.create_index([("username", ASCENDING)])
        feedback_data.create_index([("createdAt", DESCENDING)])
        
        prediction_history.create_index([("predictionId", ASCENDING)], unique=True)
        prediction_history.create_index([("username", ASCENDING)])
        prediction_history.create_index([("predictionTimestamp", DESCENDING)])
        
        model_versions.create_index([("versionNumber", ASCENDING)], unique=True)
        model_versions.create_index([("deploymentStatus", ASCENDING)])
        
        retraining_logs.create_index([("startTime", DESCENDING)])
        
        logger.info("Database indexes setup successfully.")
    except Exception as e:
        logger.error(f"Error setting up database indexes: {e}")
        raise e
