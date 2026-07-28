import os
import urllib.request

MODEL_URL = "https://github.com/Ketemaw/Tumor-MedTriage/releases/download/v1.0-model/ensemble_model.h5"
MODEL_PATH = "ml_models/ensemble_model.h5"

def ensure_model_downloaded():
    if os.path.exists(MODEL_PATH):
        print(f"Model already exists at {MODEL_PATH}, skipping download.")
        return

    print(f"Model not found locally. Downloading from {MODEL_URL} ...")
    os.makedirs("ml_models", exist_ok=True)
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("Model downloaded successfully.")

if __name__ == "__main__":
    ensure_model_downloaded()