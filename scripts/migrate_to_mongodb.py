#!/usr/bin/env python3
"""
One-Time Migration Script
=========================================================
Imports dataset/train.csv and dataset/test.csv into MongoDB.
Does NOT run automatically - must be executed manually.
Prevents duplicate imports using unique profileHash indexes.
Displays exact import statistics.
=========================================================
"""

import os
import sys
import hashlib
from datetime import datetime, timezone
import pandas as pd
from pathlib import Path
from pymongo import UpdateOne

# Add ml-service directory to python path
sys.path.append(str(Path(__file__).resolve().parent.parent / "ml-service"))

from db_config import (
    training_data,
    testing_data,
    setup_database_indexes,
    logger
)

def compute_profile_hash(row) -> str:
    """Compute SHA-256 hash of feature values to uniquely identify a record."""
    feature_str = (
        f"{row['profile pic']}|{row['nums/length username']}|{row['fullname words']}|"
        f"{row['nums/length fullname']}|{row['name==username']}|{row['description length']}|"
        f"{row['external URL']}|{row['private']}|{row['#posts']}|{row['#followers']}|"
        f"{row['#follows']}|{row['fake']}"
    )
    return hashlib.sha256(feature_str.encode('utf-8')).hexdigest()

def row_to_doc(row, profile_hash: str, source_tag: str) -> dict:
    """Convert pandas DataFrame row to clean MongoDB JSON document."""
    return {
        "profile pic": int(row["profile pic"]),
        "nums/length username": float(row["nums/length username"]),
        "fullname words": int(row["fullname words"]),
        "nums/length fullname": float(row["nums/length fullname"]),
        "name==username": int(row["name==username"]),
        "description length": int(row["description length"]),
        "external URL": int(row["external URL"]),
        "private": int(row["private"]),
        "#posts": int(row["#posts"]),
        "#followers": int(row["#followers"]),
        "#follows": int(row["#follows"]),
        "fake": int(row["fake"]),
        "profileHash": profile_hash,
        "source": source_tag,
        "verified": True,
        "createdAt": datetime.now(timezone.utc)
    }

def migrate_csv(file_path: Path, collection, source_tag: str):
    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        return 0, 0

    df = pd.read_csv(file_path)
    logger.info(f"Reading {file_path} ({len(df)} total rows)...")

    operations = []
    for idx, row in df.iterrows():
        p_hash = compute_profile_hash(row)
        doc = row_to_doc(row, p_hash, source_tag)
        operations.append(
            UpdateOne({"profileHash": p_hash}, {"$setOnInsert": doc}, upsert=True)
        )

    if not operations:
        return 0, 0

    # Bulk execute
    result = collection.bulk_write(operations, ordered=False)
    imported_count = result.upserted_count
    skipped_count = len(df) - imported_count
    return imported_count, skipped_count

def run_migration():
    print("=========================================================")
    print("STARTING ONE-TIME MONGODB DATASET MIGRATION")
    print("=========================================================")

    # Ensure indexes exist
    setup_database_indexes()

    project_root = Path(__file__).resolve().parent.parent
    
    # Check paths in dataset/ or ml-service/datasets/
    train_path = project_root / "dataset" / "train.csv"
    if not train_path.exists():
        train_path = project_root / "ml-service" / "datasets" / "train.csv"

    test_path = project_root / "dataset" / "test.csv"
    if not test_path.exists():
        test_path = project_root / "ml-service" / "datasets" / "test.csv"

    train_imported, train_skipped = migrate_csv(train_path, training_data, "dataset_train_csv")
    test_imported, test_skipped = migrate_csv(test_path, testing_data, "dataset_test_csv")

    total_skipped = train_skipped + test_skipped

    print("=========================================================")
    print("MIGRATION COMPLETED SUCCESSFULLY")
    print("=========================================================")
    print(f"Training Records Imported : {train_imported}")
    print(f"Testing Records Imported  : {test_imported}")
    print(f"Duplicate Records Skipped : {total_skipped}")
    print("=========================================================")

if __name__ == "__main__":
    run_migration()
