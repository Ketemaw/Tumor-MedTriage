import os
import urllib.request

MODEL_URL = "https://github.com/Ketemaw/Tumor-MedTriage/releases/download/v1.0-model/ensemble_model.h5"

MODEL_PATH = "ml_models/ensemble_model.h5"


def ensure_model_downloaded():
    if os.path.exists(MODEL_PATH):
        print("Model already present locally, skipping download.")
        return
    # print(f"Model not found locally. Downloading from {MODEL_URL} ...")
    # urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)

if __name__ == "__main__":
    ensure_model_downloaded()