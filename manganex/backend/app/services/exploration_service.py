"""
Exploration service.

Wraps the trained prospectivity model to serve:
  - the ranked target list (from the training dataset points, treated as
    "candidate exploration targets")
  - an on-the-fly heatmap grid for a selected region/state
  - a single target's full detail report (prospectivity, confidence,
    parameters, explanation)
"""
from __future__ import annotations
import warnings
from typing import Any

import numpy as np
import pandas as pd

# The per-tree .predict() calls below intentionally pass a DataFrame (for
# readability) even though individual DecisionTreeClassifier sub-estimators
# were fit without column names recorded; sklearn's harmless consistency
# warning is suppressed here rather than converting to bare numpy arrays.
warnings.filterwarnings(
    "ignore", message="X has feature names, but DecisionTreeClassifier"
)

from app.core.config import REGIONS
from app.data.generate_exploration_data import STATE_BOUNDS, features_for_points
from app.ml.prospectivity_model import (
    FEATURE_COLUMNS, get_bundle, predict_proba, explain_prediction,
)


def _priority_for(prob: float) -> str:
    if prob >= 0.75:
        return "HIGH"
    if prob >= 0.5:
        return "MEDIUM"
    return "LOW"


def _confidence_for(row_features: dict[str, float], prob: float) -> float:
    """Confidence proxy: the RandomForest's tree-vote agreement (how
    concentrated the ensemble's votes are), scaled to a 0-1 range. This is
    a legitimate model-internal confidence measure, distinct from the
    prospectivity probability itself.
    """
    bundle = get_bundle()
    x = pd.DataFrame([{c: row_features[c] for c in FEATURE_COLUMNS}])
    tree_preds = np.array([t.predict(x)[0] for t in bundle.model.estimators_])
    agreement = max(tree_preds.mean(), 1 - tree_preds.mean())
    return float(agreement)


def get_regions() -> list[dict[str, Any]]:
    return [{"id": k, **v} for k, v in REGIONS.items()]


def get_targets(state: str, limit: int = 20) -> list[dict[str, Any]]:
    bundle = get_bundle()
    df = bundle.dataset[bundle.dataset["state"] == state].copy()
    if df.empty:
        return []

    probs = bundle.model.predict_proba(df[FEATURE_COLUMNS])[:, 1]
    df["prospectivity"] = probs
    df = df.sort_values("prospectivity", ascending=False).head(limit)

    targets = []
    for _, row in df.iterrows():
        feats = row[FEATURE_COLUMNS].to_dict()
        conf = _confidence_for(feats, row["prospectivity"])
        targets.append({
            "target_id": row["target_id"],
            "state": state,
            "latitude": round(float(row["latitude"]), 5),
            "longitude": round(float(row["longitude"]), 5),
            "prospectivity": round(float(row["prospectivity"]), 4),
            "confidence": round(conf, 4),
            "priority": _priority_for(row["prospectivity"]),
        })
    return targets


def get_target_detail(target_id: str) -> dict[str, Any] | None:
    bundle = get_bundle()
    match = bundle.dataset[bundle.dataset["target_id"] == target_id]
    if match.empty:
        return None
    row = match.iloc[0]
    feats = row[FEATURE_COLUMNS].to_dict()
    prob = predict_proba(feats)
    conf = _confidence_for(feats, prob)
    explanation = explain_prediction(feats)

    top_factor = explanation[0]["factor"] if explanation else "geological and spectral characteristics"
    second_factor = explanation[1]["factor"] if len(explanation) > 1 else None
    why = (
        f"{'High' if prob >= 0.5 else 'Limited'} prospectivity is primarily associated with "
        f"{top_factor.lower()}"
        + (f" and {second_factor.lower()}" if second_factor else "")
        + " observed at this location relative to the regional baseline."
    )

    return {
        "target_id": row["target_id"],
        "state": row["state"],
        "latitude": round(float(row["latitude"]), 5),
        "longitude": round(float(row["longitude"]), 5),
        "prospectivity": round(float(prob), 4),
        "confidence": round(conf, 4),
        "priority": _priority_for(prob),
        "parameters": {
            "spectral_similarity": _priority_for(feats["iron_oxide_index"]),
            "geological_suitability": _priority_for(feats["geology_score"]),
            "terrain_suitability": "HIGH" if feats["slope"] < 10 else ("MEDIUM" if feats["slope"] < 22 else "LOW"),
            "vegetation_interference": "LOW" if feats["ndvi"] < 0.25 else ("MEDIUM" if feats["ndvi"] < 0.5 else "HIGH"),
            "distance_from_known_occurrence_km": round(float(feats["distance_to_occurrence"]), 2),
        },
        "explanation": {
            "summary": why,
            "feature_contributions": explanation,
        },
        "disclaimer": (
            "Model outputs indicate exploration prospectivity and require geological "
            "validation, field sampling, geophysical investigation, and drilling before "
            "any reserve can be confirmed."
        ),
        "label": "Prototype / Sample Data",
    }


def get_heatmap(state: str, grid_size: int = 22, seed: int = 123) -> dict[str, Any]:
    if state not in STATE_BOUNDS:
        return {"state": state, "cells": []}

    bounds = STATE_BOUNDS[state]
    lats = np.linspace(bounds["lat"][0], bounds["lat"][1], grid_size)
    lons = np.linspace(bounds["lon"][0], bounds["lon"][1], grid_size)
    grid_lat, grid_lon = np.meshgrid(lats, lons)
    flat_lat, flat_lon = grid_lat.ravel(), grid_lon.ravel()

    rng = np.random.default_rng(seed)
    feats_df = features_for_points(flat_lat, flat_lon, state, rng)

    bundle = get_bundle()
    probs = bundle.model.predict_proba(feats_df[FEATURE_COLUMNS])[:, 1]

    cells = [
        {
            "latitude": round(float(la), 5),
            "longitude": round(float(lo), 5),
            "prospectivity": round(float(p), 4),
            "level": _priority_for(p),
        }
        for la, lo, p in zip(flat_lat, flat_lon, probs)
    ]
    return {
        "state": state,
        "grid_size": grid_size,
        "cells": cells,
        "legend": {"high": "≥ 0.75", "medium": "0.50 – 0.74", "low": "< 0.50"},
        "label": "Prototype / Sample Data — synthetic grid, not a survey result",
    }
