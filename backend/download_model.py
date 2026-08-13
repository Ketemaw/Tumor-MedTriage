import os
import urllib.request

MODEL_URL = "https://github.com/Ketemaw/Tumor-MedTriage/releases/download/v1.0-model/ensemble_model.h5"
MODEL_PATH = "ml_models/ensemble_model.h5"

GATE_MODEL_URL = "https://github.com/Ketemaw/Tumor-MedTriage/releases/download/v1.0-gate-model/mri_classifier.h5"
GATE_MODEL_PATH = "ml_models/mri_classifier.h5"


def _ensure_file_downloaded(url: str, path: str, label: str):
    if os.path.exists(path):
        print(f"{label} already present locally, skipping download.")
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    print(f"{label} not found locally. Downloading from {url} ...")
    urllib.request.urlretrieve(url, path)
    print(f"{label} downloaded successfully.")


def ensure_gate_model_downloaded():
    _ensure_file_downloaded(GATE_MODEL_URL, GATE_MODEL_PATH, "MRI gate model")
    
def ensure_model_downloaded():
    _ensure_file_downloaded(MODEL_URL, MODEL_PATH, "Tumor model")




if __name__ == "__main__":
    ensure_model_downloaded()
    ensure_gate_model_downloaded()