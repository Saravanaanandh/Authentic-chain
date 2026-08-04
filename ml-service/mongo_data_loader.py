import logging
import pandas as pd
from db_config import training_data, testing_data

logger = logging.getLogger("mongo_data_loader")

FEATURE_COLUMNS = [
    "profile pic",
    "nums/length username",
    "fullname words",
    "nums/length fullname",
    "name==username",
    "description length",
    "external URL",
    "private",
    "#posts",
    "#followers",
    "#follows",
    "fake"
]

def load_dataset_from_collection(collection, collection_name: str) -> pd.DataFrame:
    """
    Fetches data from specified MongoDB collection and transforms it 
    into a structured Pandas DataFrame matching the original CSV schema.
    """
    try:
        logger.info(f"Fetching dataset from MongoDB collection '{collection_name}'...")
        cursor = collection.find({}, {
            "_id": 0,
            "profile pic": 1,
            "nums/length username": 1,
            "fullname words": 1,
            "nums/length fullname": 1,
            "name==username": 1,
            "description length": 1,
            "external URL": 1,
            "private": 1,
            "#posts": 1,
            "#followers": 1,
            "#follows": 1,
            "fake": 1
        })
        
        docs = list(cursor)
        if not docs:
            logger.warning(f"No records found in collection '{collection_name}'.")
            return pd.DataFrame(columns=FEATURE_COLUMNS)

        df = pd.DataFrame(docs)
        
        # Ensure all feature columns exist and order matches exactly
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0

        df = df[FEATURE_COLUMNS]
        
        # Ensure numerical types match ML model expectations
        df["profile pic"] = df["profile pic"].astype(int)
        df["nums/length username"] = df["nums/length username"].astype(float)
        df["fullname words"] = df["fullname words"].astype(int)
        df["nums/length fullname"] = df["nums/length fullname"].astype(float)
        df["name==username"] = df["name==username"].astype(int)
        df["description length"] = df["description length"].astype(int)
        df["external URL"] = df["external URL"].astype(int)
        df["private"] = df["private"].astype(int)
        df["#posts"] = df["#posts"].astype(int)
        df["#followers"] = df["#followers"].astype(int)
        df["#follows"] = df["#follows"].astype(int)
        df["fake"] = df["fake"].astype(int)

        logger.info(f"Successfully loaded {len(df)} records from '{collection_name}'.")
        return df

    except Exception as e:
        logger.error(f"Error loading dataset from MongoDB collection '{collection_name}': {e}")
        raise e

def load_training_data_from_db() -> pd.DataFrame:
    """Loads training dataset dynamically from MongoDB training_data collection."""
    return load_dataset_from_collection(training_data, "training_data")

def load_testing_data_from_db() -> pd.DataFrame:
    """Loads testing dataset dynamically from MongoDB testing_data collection."""
    return load_dataset_from_collection(testing_data, "testing_data")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_df = load_training_data_from_db()
    test_df = load_testing_data_from_db()
    print("Loaded Training Shape:", train_df.shape)
    print("Loaded Testing Shape:", test_df.shape)
