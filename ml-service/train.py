import os
import joblib
import pandas as pd
import numpy as np
import logging
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.naive_bayes import GaussianNB
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from mongo_data_loader import load_training_data_from_db, load_testing_data_from_db

logger = logging.getLogger("train_pipeline")

def load_data():
    """
    Loads training and testing datasets directly from MongoDB collections.
    No CSV files are accessed during runtime.
    """
    logger.info("Loading training and testing datasets from MongoDB...")
    train_df = load_training_data_from_db()
    test_df = load_testing_data_from_db()
    
    if train_df.empty:
        raise ValueError("Training dataset in MongoDB is empty! Run migration script first.")

    X_train = train_df.drop(columns=['fake'])
    y_train = train_df['fake']
    
    if not test_df.empty and 'fake' in test_df.columns:
        X_test = test_df.drop(columns=['fake'])
        y_test = test_df['fake']
    else:
        # Fallback split if test dataset collection is empty
        X_train, X_test, y_train, y_test = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
        )
    
    return X_train, y_train, X_test, y_test

def train_tabular_models(X_train, y_train, X_test, y_test):
    """
    Trains all classifiers (Decision Tree, Random Forest, Naive Bayes, XGBoost, LightGBM)
    and evaluates metrics.
    """
    logger.info("Training Decision Tree Classifier...")
    dt = DecisionTreeClassifier(random_state=42)
    dt.fit(X_train, y_train)
    dt_preds = dt.predict(X_test)
    dt_acc = accuracy_score(y_test, dt_preds)
    logger.info(f"Decision Tree Accuracy: {dt_acc:.4f}")

    logger.info("Training Naive Bayes Classifier...")
    nb = GaussianNB()
    nb.fit(X_train, y_train)
    nb_preds = nb.predict(X_test)
    nb_acc = accuracy_score(y_test, nb_preds)
    logger.info(f"Naive Bayes Accuracy: {nb_acc:.4f}")

    logger.info("Training Random Forest Classifier...")
    rf = RandomForestClassifier(random_state=42, n_estimators=100)
    rf.fit(X_train, y_train)
    rf_preds = rf.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_preds)
    logger.info(f"Random Forest Accuracy: {rf_acc:.4f}")

    logger.info("Training LightGBM Classifier...")
    lgbm = LGBMClassifier(random_state=42, n_estimators=100)
    lgbm.fit(X_train, y_train)
    lgbm_preds = lgbm.predict(X_test)
    lgbm_acc = accuracy_score(y_test, lgbm_preds)
    logger.info(f"LightGBM Accuracy: {lgbm_acc:.4f}")

    logger.info("Training XGBoost Classifier...")
    xgb = XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42, n_estimators=100)
    xgb.fit(X_train, y_train)
    xgb_preds = xgb.predict(X_test)
    xgb_acc = accuracy_score(y_test, xgb_preds)
    logger.info(f"XGBoost Accuracy: {xgb_acc:.4f}")

    # Evaluate best primary model (XGBoost) metrics for registry logging
    acc = float(accuracy_score(y_test, xgb_preds))
    prec = float(precision_score(y_test, xgb_preds, zero_division=0))
    rec = float(recall_score(y_test, xgb_preds, zero_division=0))
    f1 = float(f1_score(y_test, xgb_preds, zero_division=0))

    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(xgb, os.path.join(models_dir, 'tabular_xgb.pkl'))
    logger.info(f"Tabular model saved to {os.path.join(models_dir, 'tabular_xgb.pkl')}")

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1Score": round(f1, 4),
        "dt_accuracy": round(dt_acc, 4),
        "nb_accuracy": round(nb_acc, 4),
        "rf_accuracy": round(rf_acc, 4),
        "lgbm_accuracy": round(lgbm_acc, 4),
        "xgb_accuracy": round(xgb_acc, 4),
    }
    return metrics

def train_anomaly_model(X_train):
    """Trains Isolation Forest for anomaly detection."""
    logger.info("Training Isolation Forest for Anomaly Detection...")
    iso = IsolationForest(contamination=0.1, random_state=42)
    iso.fit(X_train)
    
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(iso, os.path.join(models_dir, 'anomaly_iso.pkl'))
    logger.info(f"Anomaly model saved to {os.path.join(models_dir, 'anomaly_iso.pkl')}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    try:
        X_train, y_train, X_test, y_test = load_data()
        metrics = train_tabular_models(X_train, y_train, X_test, y_test)
        train_anomaly_model(X_train)
        print("Training pipeline completed successfully. Metrics:", metrics)
    except Exception as e:
        logger.error(f"Training failed: {e}")
