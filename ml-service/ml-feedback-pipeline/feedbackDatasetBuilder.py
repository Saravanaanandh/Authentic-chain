import os
import json
from datetime import datetime

class FeedbackDatasetBuilder:
    def __init__(self, output_dir="data/feedback"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def fetch_approved_feedback(self):
        """
        In a real scenario, this would connect to MongoDB's ModelFeedback collection
        and fetch records where approvedForTraining == True.
        """
        print("[DatasetBuilder] Fetching approved feedback from database...")
        # Mocking data
        return [
            {
                "username": "mock_real_user",
                "userCorrectedLabel": "Real",
                "profileSnapshot": {"followers": 1000, "following": 500}
            }
        ]

    def build_dataset(self):
        records = self.fetch_approved_feedback()
        dataset_path = os.path.join(self.output_dir, f"feedback_dataset_{datetime.now().strftime('%Y%m%d%H%M%S')}.json")
        with open(dataset_path, "w") as f:
            json.dump(records, f)
        print(f"[DatasetBuilder] Built dataset with {len(records)} records at {dataset_path}")
        return dataset_path
