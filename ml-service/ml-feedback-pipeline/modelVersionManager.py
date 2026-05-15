import os
from datetime import datetime

class ModelVersionManager:
    def __init__(self, registry_dir="models/registry"):
        self.registry_dir = registry_dir
        os.makedirs(self.registry_dir, exist_ok=True)

    def get_current_version(self):
        return "v1.0.0"

    def promote_model(self):
        """
        Promotes the newly trained model to production.
        """
        new_version = f"v1.0.{datetime.now().strftime('%m%d%H%M')}"
        print(f"[ModelVersionManager] Archiving current version...")
        print(f"[ModelVersionManager] Promoting {new_version} to active slot...")
        
        # Save dummy registry info
        registry_path = os.path.join(self.registry_dir, "active_model.txt")
        with open(registry_path, "w") as f:
            f.write(new_version)
            
        return new_version
