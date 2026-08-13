import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.models import load_model
from download_model import ensure_model_downloaded, ensure_gate_model_downloaded
from config import settings

CLASSES = ['glioma', 'meningioma', 'notumor', 'pituitary']
IMAGE_SIZE = (224, 224)

# --- Gate model config ---
GATE_MODEL_PATH = "ml_models/mri_classifier.h5"
GATE_CLASS_NAMES = ['brain_mri', 'not_mri']
GATE_THRESHOLD = 0.3  # conservative: reject if not_mri probability > 0.3
GATE_IMAGE_SIZE = (224, 224)


class WeightedAverageLayer(tf.keras.layers.Layer):
    def __init__(self, w1, w2, w3, **kwargs):
        super(WeightedAverageLayer, self).__init__(**kwargs)
        self.w1 = w1
        self.w2 = w2
        self.w3 = w3

    def call(self, inputs):
        return self.w1 * inputs[0] + self.w2 * inputs[1] + self.w3 * inputs[2]

    def get_config(self):
        config = super().get_config()
        config.update({"w1": self.w1, "w2": self.w2, "w3": self.w3})
        return config


ensure_model_downloaded()
ensure_gate_model_downloaded()
_model = None
_gate_model = None


def get_model():
    global _model

    if _model is None:
        print("Loading model...")

        _model = load_model(
            settings.model_path,
            custom_objects={
                "WeightedAverageLayer": WeightedAverageLayer
            },
        )

        print("Model loaded successfully")

    return _model


def get_gate_model():
    global _gate_model

    if _gate_model is None:
        print("Loading MRI gate model...")
        _gate_model = load_model(GATE_MODEL_PATH)
        print("Gate model loaded successfully")

    return _gate_model


def preprocess_image(image_path: str, size=IMAGE_SIZE, normalize=True) -> np.ndarray:
    img = Image.open(image_path).convert("RGB")
    img = img.resize(size)
    img_array = np.array(img)
    if normalize:
        img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def is_brain_mri(image_path: str) -> tuple[bool, float]:
    """Returns (is_mri, not_mri_probability)"""
    gate_model = get_gate_model()
    # gate model has its own Rescaling(1./255) layer internally — don't double-normalize
    img_array = preprocess_image(image_path, size=GATE_IMAGE_SIZE, normalize=False)

    not_mri_prob = float(gate_model.predict(img_array, verbose=0)[0][0])
    is_mri = not_mri_prob < GATE_THRESHOLD
    return is_mri, not_mri_prob


def determine_priority(predicted_class: str, confidence: float) -> str:
    if predicted_class == "notumor":
        return "low"
    if confidence >= 0.85:
        return "urgent"
    return "moderate"


def predict_scan(image_path: str) -> dict:
    # --- Gate check first ---
    is_mri, not_mri_prob = is_brain_mri(image_path)

    if not is_mri:
        return {
            "error": "invalid_image_type",
            "message": "This doesn't appear to be a brain MRI scan. Please upload a valid brain MRI image.",
            "confidence": round(not_mri_prob, 4),
        }

    # --- Existing tumor classification ---
    model = get_model()

    img_array = preprocess_image(image_path)

    raw_predictions = model.predict(img_array)[0]

    predicted_index = int(np.argmax(raw_predictions))
    predicted_class = CLASSES[predicted_index]
    confidence = float(raw_predictions[predicted_index])
    priority = determine_priority(predicted_class, confidence)

    all_probabilities = {CLASSES[i]: float(raw_predictions[i]) for i in range(len(CLASSES))}

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "priority": priority,
        "all_probabilities": all_probabilities,
    }