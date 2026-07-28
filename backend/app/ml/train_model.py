"""Trains a RandomForestRegressor to predict test quality score (0-100)
from five features, on synthetic data labeled with the weighted-formula
baseline plus noise (so the model learns the same signal but generalizes
past the linear formula). Saves the trained model to model.joblib next to
this file.

Run with:  python -m app.ml.train_model
"""

import os

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from app.ml.weights import FEATURE_ORDER, weighted_score

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")


def generate_synthetic_data(n_samples: int = 4000, seed: int = 42):
    rng = np.random.default_rng(seed)
    X = rng.uniform(0, 100, size=(n_samples, len(FEATURE_ORDER)))

    y = np.empty(n_samples)
    for i in range(n_samples):
        features = dict(zip(FEATURE_ORDER, X[i]))
        base = weighted_score(features)
        # Add gaussian noise and a small nonlinear bonus for tests that are
        # strong across the board, so the learned model isn't purely linear.
        synergy_bonus = 3.0 if all(v >= 70 for v in X[i]) else 0.0
        noise = rng.normal(0, 4.0)
        y[i] = np.clip(base + synergy_bonus + noise, 0, 100)

    return X, y


def train():
    X, y = generate_synthetic_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=3,
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"Validation MAE: {mae:.2f}  R2: {r2:.3f}")

    joblib.dump({"model": model, "feature_order": FEATURE_ORDER}, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    train()
