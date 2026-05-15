import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

def load_data(train_path, test_path):
    print("Loading datasets...")
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)
    
    # Combine for unified preprocessing if needed, or process separately
    # For simplicity, we assume they have the same columns
    X_train = train_df.drop(columns=['fake'])
    y_train = train_df['fake']
    
    X_test = test_df.drop(columns=['fake'])
    y_test = test_df['fake']
    
    return X_train, y_train, X_test, y_test

def train_tabular_models(X_train, y_train, X_test, y_test):
    print("Training XGBoost Classifier...")
    xgb = XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42, n_estimators=100)
    xgb.fit(X_train, y_train)
    xgb_preds = xgb.predict(X_test)
    print("XGBoost Accuracy:", accuracy_score(y_test, xgb_preds))
    print("XGBoost ROC AUC:", roc_auc_score(y_test, xgb.predict_proba(X_test)[:, 1]))
    
    print("Training LightGBM Classifier...")
    lgbm = LGBMClassifier(random_state=42, n_estimators=100)
    lgbm.fit(X_train, y_train)
    lgbm_preds = lgbm.predict(X_test)
    print("LightGBM Accuracy:", accuracy_score(y_test, lgbm_preds))
    
    print("Training RandomForest Classifier...")
    rf = RandomForestClassifier(random_state=42, n_estimators=100)
    rf.fit(X_train, y_train)
    rf_preds = rf.predict(X_test)
    print("RandomForest Accuracy:", accuracy_score(y_test, rf_preds))
    
    # Save the best tabular model (we'll assume XGBoost for simplicity in ensemble)
    os.makedirs("models", exist_ok=True)
    joblib.dump(xgb, 'models/tabular_xgb.pkl')
    print("Tabular model saved to models/tabular_xgb.pkl")

def train_anomaly_model(X_train):
    print("Training Isolation Forest for Anomaly Detection...")
    iso = IsolationForest(contamination=0.1, random_state=42)
    # We train anomaly detection on the training data
    iso.fit(X_train)
    
    os.makedirs("models", exist_ok=True)
    joblib.dump(iso, 'models/anomaly_iso.pkl')
    print("Anomaly model saved to models/anomaly_iso.pkl")

if __name__ == "__main__":
    # Adjust paths based on the execution directory
    train_path = os.path.join(os.path.dirname(__file__), "datasets/train.csv")
    test_path = os.path.join(os.path.dirname(__file__), "datasets/test.csv")
    
    if os.path.exists(train_path) and os.path.exists(test_path):
        X_train, y_train, X_test, y_test = load_data(train_path, test_path)
        train_tabular_models(X_train, y_train, X_test, y_test)
        train_anomaly_model(X_train)
        print("Training pipeline completed successfully.")
    else:
        print("Could not find train.csv or test.csv in the root directory.")
