import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
import numpy as np
from PIL import Image
from download_model import ensure_model_downloaded
from config import settings

CLASSES = ['glioma', 'meningioma', 'notumor', 'pituitary']
IMAGE_SIZE = (224, 224)


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
#loading the model
_model = tf.keras.models.load_model(
    settings.model_path,
    custom_objects={"WeightedAverageLayer": WeightedAverageLayer},
)


def preprocess_image(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("RGB")
    img = img.resize(IMAGE_SIZE)
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def determine_priority(predicted_class: str, confidence: float) -> str:
    if predicted_class == "notumor":
        return "low"
    if confidence >= 0.85:
        return "urgent"
    return "moderate"


def predict_scan(image_path: str) -> dict:
    img_array = preprocess_image(image_path)
    raw_predictions = _model.predict(img_array)[0]

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