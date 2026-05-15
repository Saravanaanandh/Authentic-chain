# FakeID Shield ML Microservice

This microservice provides high-accuracy fake profile detection via a multi-model ensemble system.

## Architecture

The AI engine combines four distinct detection models into a weighted final score:
1. **Tabular Classifier (XGBoost)** (40% Weight) - Analyzes profile metrics and structural metadata.
2. **Image Similarity (Mocked FaceNet/CLIP)** (30% Weight) - Designed to identify duplicated/stolen profile photos.
3. **Bio NLP Analyzer (Mocked DistilBERT)** (20% Weight) - Scans for spam keywords and phishing language.
4. **Anomaly Detection (Isolation Forest)** (10% Weight) - Identifies outlier behavior that resembles bot farms.

## Requirements

Ensure Python 3.9+ is installed.

```bash
pip install -r requirements.txt
```

## Training

To re-train the models with the provided Kaggle datasets (`train.csv` and `test.csv` in the root folder):

```bash
python train.py
```

This script will run Cross Validation and hyperparameter comparisons across XGBoost, LightGBM, and RandomForest. The best performing models (XGBoost for tabular, IsolationForest for anomaly detection) will be saved to the `models/` directory.

## Running Locally

To start the FastAPI server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The Next.js backend will automatically proxy requests to this server at `http://127.0.0.1:8000/predict-profile` during profile analysis.

## Deployment Instructions

### Deploying the Python Microservice (Render)
1. Push this repository to GitHub.
2. Create a new "Web Service" in Render.
3. Connect the repository and select the `ml-service` directory as the Root Directory.
4. Set the Build Command: `pip install -r requirements.txt`
5. Set the Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Once deployed, note the Render URL.

### Integrating with Next.js
In your Next.js environment variables (on Vercel or locally), add the production URL of the ML service:

```
ML_SERVICE_URL=https://your-ml-service.onrender.com/predict-profile
ML_SERVICE_API_KEY=fakeid-shield-secret-key-2026
```
*(Note: For the current implementation, the Node.js API `src/app/api/instagram/analyze/route.ts` is hardcoded to `http://127.0.0.1:8000/predict-profile`. You will need to change this to `process.env.ML_SERVICE_URL` before deploying to production).*

## Next Steps
To further scale for SIH/Hackathons:
- **Real Image Embeddings**: Replace the mock `get_image_score` logic in `ensemble.py` with actual `transformers` or `face_recognition` logic.
- **Admin Dashboard Integration**: The `InstagramAnalysis` database schema now stores `tabularScore`, `imageScore`, `bioScore`, and `anomalyScore`. You can visualize these specific trends on the Next.js admin dashboard.
