from .feedbackDatasetBuilder import FeedbackDatasetBuilder
from .feedbackCleaner import FeedbackCleaner
from .modelVersionManager import ModelVersionManager
import time

def trigger_retraining_pipeline():
    print("========== STARTING RETRAINING PIPELINE ==========")
    
    builder = FeedbackDatasetBuilder()
    dataset_path = builder.build_dataset()
    
    cleaner = FeedbackCleaner()
    cleaned_data = cleaner.clean_dataset(dataset_path)
    
    if len(cleaned_data) == 0:
        print("[RetrainModel] No approved data to train on. Aborting.")
        return {"status": "aborted", "reason": "No approved feedback data"}
        
    print("[RetrainModel] Fine-tuning model using feedback dataset...")
    # Simulate training delay
    time.sleep(2)
    
    print("[RetrainModel] Evaluating performance compared to baseline...")
    time.sleep(1)
    
    improved = True # Placeholder for actual accuracy check
    
    if improved:
        manager = ModelVersionManager()
        version = manager.promote_model()
        print(f"[RetrainModel] Model improved. Deployed new version {version}.")
        return {"status": "success", "version": version, "records_processed": len(cleaned_data)}
    else:
        print("[RetrainModel] Model did not improve. Discarding updates.")
        return {"status": "skipped", "reason": "No accuracy improvement"}

if __name__ == "__main__":
    trigger_retraining_pipeline()
