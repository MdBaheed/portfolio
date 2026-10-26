"""
Manganese prospectivity ML model.

Trains a RandomForestClassifier on the synthetic exploration dataset to
predict `manganese_prospectivity` (binary: prospective / not) from
spectral, terrain and geological features, and exposes:
  - predict_proba for any feature vector (used by the heatmap + target grid)
  - held-out test metrics (accuracy / precision / recall / F1)
  - global feature importance
  - a per-prediction explanation (approximate local feature contribution)

IMPORTANT: metrics are computed on synthetic data and are explicitly
labelled "Demo ML model performance on synthetic data" wherever surfaced
via the API. They are a demonstration of a working ML pipeline, not a
claim about real-world geological prediction accuracy.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from app.data.generate_exploration_data import generate_dataset, DATA_DIR

FEATURE_COLUMNS = [
    "red", "green", "blue", "nir", "swir1", "swir2",
    "ndvi", "ndwi", "elevation", "slope",
    "geology_score", "iron_oxide_index", "distance_to_occurrence",
]

# Human-readable labels + which "explainability bucket" each feature rolls
# up into, for the target-level explanation shown in the UI.
FEATURE_META = {
    "geology_score": {"label": "Geological suitability", "bucket": "Geological suitability"},
    "swir1": {"label": "SWIR1 reflectance", "bucket": "SWIR spectral response"},
    "swir2": {"label": "SWIR2 reflectance", "bucket": "SWIR spectral response"},
    "iron_oxide_index": {"label": "Iron/oxide spectral index", "bucket": "Iron oxide index"},
    "elevation": {"label": "Elevation", "bucket": "Terrain characteristics"},
    "slope": {"label": "Slope", "bucket": "Terrain characteristics"},
    "distance_to_occurrence": {"label": "Distance to known occurrence", "bucket": "Distance to occurrence"},
    "ndvi": {"label": "Vegetation index (NDVI)", "bucket": "Vegetation interference"},
    "ndwi": {"label": "Water index (NDWI)", "bucket": "Vegetation interference"},
    "red": {"label": "Red band reflectance", "bucket": "Other factors"},
    "green": {"label": "Green band reflectance", "bucket": "Other factors"},
    "blue": {"label": "Blue band reflectance", "bucket": "Other factors"},
    "nir": {"label": "NIR reflectance", "bucket": "Other factors"},
}


@dataclass
class ModelBundle:
    model: RandomForestClassifier
    metrics: dict[str, Any]
    feature_importance: list[dict[str, Any]]
    dataset: pd.DataFrame
    label_note: str = "Demo ML model performance on synthetic data"


_bundle: ModelBundle | None = None


def _load_or_generate_dataset() -> pd.DataFrame:
    path = DATA_DIR / "exploration_dataset.csv"
    if path.exists():
        return pd.read_csv(path)
    df = generate_dataset()
    df.to_csv(path, index=False)
    return df


def train_model() -> ModelBundle:
    """Train the RandomForest prospectivity model and cache the bundle."""
    global _bundle
    df = _load_or_generate_dataset()

    X = df[FEATURE_COLUMNS]
    y = df["manganese_prospectivity"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    cm = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "confusion_matrix": cm,
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "n_features": len(FEATURE_COLUMNS),
        "label": "Demo ML model performance on synthetic data",
    }

    importances = clf.feature_importances_
    feature_importance = sorted(
        [
            {
                "feature": f,
                "label": FEATURE_META.get(f, {}).get("label", f),
                "importance": round(float(imp), 4),
            }
            for f, imp in zip(FEATURE_COLUMNS, importances)
        ],
        key=lambda r: -r["importance"],
    )

    _bundle = ModelBundle(
        model=clf,
        metrics=metrics,
        feature_importance=feature_importance,
        dataset=df,
    )
    return _bundle


def get_bundle() -> ModelBundle:
    if _bundle is None:
        return train_model()
    return _bundle


def predict_proba(feature_row: dict[str, float]) -> float:
    bundle = get_bundle()
    x = pd.DataFrame([{c: feature_row[c] for c in FEATURE_COLUMNS}])
    proba = bundle.model.predict_proba(x)[0][1]
    return float(proba)


def explain_prediction(feature_row: dict[str, float]) -> list[dict[str, Any]]:
    """Approximate local explanation: weight each feature's (normalized
    deviation from the training-set mean) by its global importance, then
    roll up into display buckets. This is a lightweight, dependency-free
    stand-in for a full SHAP explanation, adequate for demo purposes.
    """
    bundle = get_bundle()
    means = bundle.dataset[FEATURE_COLUMNS].mean()
    stds = bundle.dataset[FEATURE_COLUMNS].std().replace(0, 1)

    imp_lookup = {f["feature"]: f["importance"] for f in bundle.feature_importance}

    contributions: dict[str, float] = {}
    for f in FEATURE_COLUMNS:
        z = (feature_row[f] - means[f]) / stds[f]
        signed_contribution = z * imp_lookup[f]
        bucket = FEATURE_META.get(f, {}).get("bucket", "Other factors")
        contributions[bucket] = contributions.get(bucket, 0.0) + signed_contribution

    # Normalize contributions (can be negative) into a display-friendly
    # percentage split that sums to 100, biasing toward the requested demo
    # format (e.g. "Geological suitability +32%").
    values = np.array(list(contributions.values()))
    values = np.clip(values, 0, None)  # only show positive drivers, per spec example
    if values.sum() == 0:
        values = np.ones_like(values)
    pct = 100 * values / values.sum()

    result = [
        {"factor": bucket, "contribution_pct": round(float(p), 1)}
        for bucket, p in zip(contributions.keys(), pct)
    ]
    result.sort(key=lambda r: -r["contribution_pct"])
    return result


if __name__ == "__main__":
    bundle = train_model()
    print("Metrics:", bundle.metrics)
    print("\nFeature importance:")
    for f in bundle.feature_importance:
        print(f"  {f['label']:35s} {f['importance']:.4f}")

    sample = bundle.dataset.iloc[0][FEATURE_COLUMNS].to_dict()
    print("\nSample prediction proba:", predict_proba(sample))
    print("Sample explanation:", explain_prediction(sample))
