import os
import joblib
import pandas as pd
import numpy as np

class MLService:
    def __init__(self):
        self.tabular_model = None
        self.anomaly_model = None
        self.load_models()

    def load_models(self):
        # Load tabular model
        tabular_path = os.path.join(os.path.dirname(__file__), "models/tabular_xgb.pkl")
        if os.path.exists(tabular_path):
            self.tabular_model = joblib.load(tabular_path)
            
        # Load anomaly model
        anomaly_path = os.path.join(os.path.dirname(__file__), "models/anomaly_iso.pkl")
        if os.path.exists(anomaly_path):
            self.anomaly_model = joblib.load(anomaly_path)

    def extract_tabular_features(self, profile):
        """
        Maps incoming JSON profile data to the pandas DataFrame format expected by the models.
        The train.csv has columns:
        profile pic,nums/length username,fullname words,nums/length fullname,name==username,description length,external URL,private,#posts,#followers,#follows
        """
        has_pic = 1 if profile.profileImageUrl else 0
        
        num_digits_user = sum(c.isdigit() for c in profile.username)
        user_len = len(profile.username) if len(profile.username) > 0 else 1
        num_len_user_ratio = num_digits_user / user_len
        
        fullname_words = 1 
        num_len_full_ratio = 0.0
        
        name_eq_user = 0
        desc_len = len(profile.bio) if profile.bio else 0
        
        has_url = 0
        is_private = 0
        
        posts = profile.posts
        followers = profile.followers
        follows = profile.following
        
        features = [
            has_pic,
            num_len_user_ratio,
            fullname_words,
            num_len_full_ratio,
            name_eq_user,
            desc_len,
            has_url,
            is_private,
            posts,
            followers,
            follows
        ]
        
        feature_names = [
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
            "#follows"
        ]
        
        return pd.DataFrame([features], columns=feature_names)

    def get_image_score(self, image_url):
        if not image_url:
            return 80.0
        return float(min(100, max(0, 10 + (len(image_url) % 50))))

    def get_nlp_score(self, bio):
        if not bio:
            return 50.0
            
        suspicious_keywords = ["crypto", "forex", "investment", "bitcoin", "dm me", "cashapp", "venmo"]
        bio_lower = bio.lower()
        score = 5.0
        for word in suspicious_keywords:
            if word in bio_lower:
                score += 30.0
                
        return float(min(100.0, score))

    def predict(self, profile):
        reasons = []
        
        # 1. Tabular Score
        tabular_score = 50.0
        if self.tabular_model:
            features = self.extract_tabular_features(profile)
            prob = float(self.tabular_model.predict_proba(features)[0][1]) # Probability of fake
            tabular_score = prob * 100.0
            if tabular_score > 70:
                reasons.append({"signal": "Tabular Data", "detail": "Profile metrics match known fake distributions.", "weight": 40})
        else:
            reasons.append({"signal": "Tabular Data", "detail": "Tabular model not loaded, using heuristic fallback.", "weight": 0})
            if profile.followers < 100 and profile.following > 1000:
                tabular_score = 85.0
                reasons.append({"signal": "Tabular Heuristic", "detail": "High following with low followers.", "weight": 40})

        # 2. Image Score (Fake Image / Impersonation)
        image_score = float(self.get_image_score(profile.profileImageUrl))
        if image_score > 60:
            reasons.append({"signal": "Image Similarity", "detail": "Profile picture looks generic or matches stock/stolen images.", "weight": 30})

        # 3. NLP Score (Bio Analysis)
        bio_score = float(self.get_nlp_score(profile.bio))
        if bio_score > 50:
            reasons.append({"signal": "Bio NLP", "detail": "Bio contains spam or suspicious financial keywords.", "weight": 20})

        # 4. Anomaly Score
        anomaly_score = 0.0
        if self.anomaly_model:
            features = self.extract_tabular_features(profile)
            pred = int(self.anomaly_model.predict(features)[0])
            if pred == -1:
                anomaly_score = 80.0
                reasons.append({"signal": "Anomaly Detection", "detail": "Behavioral metrics deviate significantly from norm.", "weight": 10})
            else:
                anomaly_score = 20.0
                
        # Final Ensemble Logic (Weighted)
        # 40% Tabular, 30% Image, 20% NLP, 10% Anomaly
        final_fake_prob = float((0.4 * tabular_score) + (0.3 * image_score) + (0.2 * bio_score) + (0.1 * anomaly_score))
        
        if final_fake_prob > 75:
            verdict = "HIGHLY FAKE"
        elif final_fake_prob > 40:
            verdict = "SUSPICIOUS"
        else:
            verdict = "REAL"
            
        confidence = float(min(100.0, max(0.0, abs(final_fake_prob - 50.0) * 2.0)))
            
        return {
            "finalPrediction": str(verdict),
            "confidenceScore": float(round(confidence, 2)),
            "fakeProbability": float(round(final_fake_prob, 2)),
            "impersonationProbability": float(round(image_score * 0.8, 2)),
            "tabularScore": float(round(tabular_score, 2)),
            "imageScore": float(round(image_score, 2)),
            "bioScore": float(round(bio_score, 2)),
            "anomalyScore": float(round(anomaly_score, 2)),
            "reasons": reasons
        }

# Global Singleton
ml_service = MLService()
