"""Runtime scoring: uses the trained RandomForest model if available,
otherwise falls back to the weighted-formula baseline.
"""

import os

import joblib

from app.ml.weights import FEATURE_ORDER, weighted_score

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")

_cached = None
_load_attempted = False


def _load_model():
    global _cached, _load_attempted
    if _load_attempted:
        return _cached
    _load_attempted = True
    if os.path.exists(MODEL_PATH):
        bundle = joblib.load(MODEL_PATH)
        _cached = bundle
    return _cached


def predict_quality(features: dict) -> tuple[float, str]:
    """Returns (score 0-100, method) where method is 'ml_model' or 'weighted_formula'."""
    bundle = _load_model()
    if bundle is not None:
        model = bundle["model"]
        order = bundle["feature_order"]
        row = [[features[key] for key in order]]
        score = float(model.predict(row)[0])
        score = max(0.0, min(100.0, score))
        return score, "ml_model"

    return weighted_score(features), "weighted_formula"


__all__ = ["predict_quality", "FEATURE_ORDER"]
