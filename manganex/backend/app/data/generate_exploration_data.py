"""
Synthetic exploration dataset generator.

PURPOSE
-------
Generates a realistic-looking (but entirely synthetic) dataset of point
locations with satellite-derived spectral indices, terrain attributes and
geological attributes, plus a manganese "prospectivity" label used to train
the demo ML model.

WHY SYNTHETIC DATA
-------------------
This is an SIH prototype. We do not have access to licensed geological
survey datasets or paid hyperspectral imagery during the hackathon. To keep
the *architecture* realistic while being transparent about the data source,
we procedurally generate features that mimic real remote-sensing indices
(NDVI, NDWI, iron-oxide index, SWIR/NIR reflectance, elevation/slope) and
combine them with a hand-authored "ground truth" generating function that
encodes plausible geological heuristics (e.g. manganese mineralization is
statistically associated with certain geological units, low vegetation
interference, and specific SWIR/iron-oxide signatures).

This lets the ML pipeline (train/test split, RandomForest, feature
importance, evaluation metrics) be 100% real and runnable, while the
*labels* it learns from are simulated. Every place this matters is labelled
"Prototype / Sample Data" in the API responses so it is never confused with
a real survey.

REPLACING WITH REAL DATA LATER
-------------------------------
To swap in real data:
  1. Replace `red, green, blue, nir, swir1, swir2` with band values sampled
     from Sentinel-2 L2A (10-20m) or Landsat 8/9 Collection 2 imagery at
     each point, using an API such as Copernicus Data Space / Google Earth
     Engine / USGS EarthExplorer.
  2. Replace `elevation` / `slope` with SRTM/Copernicus DEM lookups.
  3. Replace `geology_score` with an encoded categorical from the Geological
     Survey of India (GSI) lithology/geology map, joined spatially.
  4. Replace `distance_to_occurrence` with a real distance-to-nearest-known
     -occurrence calculation against the GSI/IBM mineral occurrence
     database.
  5. Replace the synthetic label with actual assay / drilling / known
     deposit outcome labels (or leave the model unsupervised / anomaly
     -detection based if labels are unavailable).
The rest of the pipeline (feature engineering -> RandomForest -> API
response) requires no structural changes.
"""

import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent / "generated"
DATA_DIR.mkdir(exist_ok=True)

# Bounding boxes for demo Indian states known for manganese occurrences.
# These are coarse bounding boxes for demo purposes only, not surveyed
# boundaries.
STATE_BOUNDS = {
    "odisha": {"lat": (19.3, 22.6), "lon": (81.4, 87.5)},
    "karnataka": {"lat": (11.6, 18.5), "lon": (74.0, 78.6)},
    "madhya_pradesh": {"lat": (21.1, 26.9), "lon": (74.0, 82.8)},
    "maharashtra": {"lat": (15.6, 22.0), "lon": (72.6, 80.9)},
}

# A handful of synthetic "known occurrence" anchor points per state. In a
# real system these would come from the GSI/IBM mineral occurrence
# database.
KNOWN_OCCURRENCES = {
    "odisha": [(21.15, 84.85), (20.35, 85.6), (21.9, 84.2)],
    "karnataka": [(15.05, 76.2), (13.9, 75.6), (14.4, 75.9)],
    "madhya_pradesh": [(23.2, 81.4), (24.6, 80.2), (22.7, 78.9)],
    "maharashtra": [(21.0, 79.1), (20.3, 79.6), (19.5, 78.4)],
}


def _haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dlambda / 2) ** 2
    return 2 * r * np.arcsin(np.sqrt(a))


def _distance_to_nearest_occurrence(lat, lon, state):
    occ = KNOWN_OCCURRENCES[state]
    dists = [_haversine_km(lat, lon, o[0], o[1]) for o in occ]
    return float(min(dists))


def features_for_points(lat: np.ndarray, lon: np.ndarray, state: str, rng: np.random.Generator) -> pd.DataFrame:
    """Generate the same synthetic feature set as the training data, but for
    arbitrary caller-supplied lat/lon points (e.g. a heatmap grid). Kept
    separate from `_generate_points_for_state` so the heatmap and the
    training dataset are guaranteed to use identical feature engineering.
    """
    n = len(lat)
    dist_to_occ = np.array([
        _distance_to_nearest_occurrence(la, lo, state) for la, lo in zip(lat, lon)
    ])

    # Geology "favorability" score in [0, 1]: higher near known occurrences,
    # with noise, mimicking spatial autocorrelation of lithological units
    # favorable to manganese (e.g. Gondite/Kodurite/BHQ associated belts).
    geology_score = np.clip(
        1.0 - (dist_to_occ / 120.0) + rng.normal(0, 0.15, n), 0, 1
    )

    elevation = rng.uniform(150, 950, n) + rng.normal(0, 40, n)
    slope = np.clip(rng.exponential(6, n), 0, 45)

    # Spectral bands (reflectance 0-1 scale, mimicking Sentinel-2 style
    # surface reflectance). Iron-oxide / manganese-bearing lateritic zones
    # tend to show elevated SWIR and reduced NIR/visible-green reflectance
    # relative to vegetated terrain.
    base_veg = np.clip(rng.beta(2, 2, n), 0, 1)  # vegetation cover proxy
    iron_signal = np.clip(geology_score * rng.uniform(0.5, 1.0, n) + rng.normal(0, 0.08, n), 0, 1)

    red = np.clip(0.12 + 0.10 * iron_signal - 0.05 * base_veg + rng.normal(0, 0.02, n), 0, 1)
    green = np.clip(0.11 + 0.05 * iron_signal - 0.04 * base_veg + rng.normal(0, 0.02, n), 0, 1)
    blue = np.clip(0.08 + 0.03 * iron_signal - 0.02 * base_veg + rng.normal(0, 0.015, n), 0, 1)
    nir = np.clip(0.10 + 0.35 * base_veg - 0.08 * iron_signal + rng.normal(0, 0.03, n), 0, 1)
    swir1 = np.clip(0.15 + 0.28 * iron_signal - 0.08 * base_veg + rng.normal(0, 0.03, n), 0, 1)
    swir2 = np.clip(0.12 + 0.30 * iron_signal - 0.07 * base_veg + rng.normal(0, 0.03, n), 0, 1)

    ndvi = (nir - red) / (nir + red + 1e-6)
    ndwi = (green - nir) / (green + nir + 1e-6)
    iron_oxide_index = (swir1 / (nir + 1e-6)) * (red / (blue + 1e-6))
    iron_oxide_index = np.clip(iron_oxide_index / (iron_oxide_index.max() + 1e-6), 0, 1)

    df = pd.DataFrame({
        "state": state,
        "latitude": lat,
        "longitude": lon,
        "red": red, "green": green, "blue": blue,
        "nir": nir, "swir1": swir1, "swir2": swir2,
        "ndvi": ndvi, "ndwi": ndwi,
        "elevation": elevation, "slope": slope,
        "geology_score": geology_score,
        "iron_oxide_index": iron_oxide_index,
        "distance_to_occurrence": dist_to_occ,
    })
    return df


def _generate_points_for_state(state: str, n: int, rng: np.random.Generator) -> pd.DataFrame:
    bounds = STATE_BOUNDS[state]
    lat = rng.uniform(*bounds["lat"], n)
    lon = rng.uniform(*bounds["lon"], n)
    return features_for_points(lat, lon, state, rng)


def _synthesize_label(df: pd.DataFrame, rng: np.random.Generator) -> pd.Series:
    """Hand-authored heuristic 'ground truth' generator for demo purposes.

    Combines geology favorability, spectral iron-oxide response, low
    vegetation interference, and proximity to known occurrences into a
    probability of manganese prospectivity, then samples a binary label.
    This is NOT a geological claim -- it exists purely so the RandomForest
    has a learnable, semantically plausible target for demonstration.
    """
    veg_interference = df["ndvi"].clip(lower=0)
    proximity_term = np.exp(-df["distance_to_occurrence"] / 25.0)

    logit = (
        3.2 * df["geology_score"]
        + 2.4 * df["iron_oxide_index"]
        + 1.6 * proximity_term
        - 1.8 * veg_interference
        + 0.4 * (df["slope"] < 25).astype(float)
        - 2.2
    )
    prob = 1 / (1 + np.exp(-logit))
    label = rng.binomial(1, prob)
    return pd.Series(label, name="manganese_prospectivity"), pd.Series(prob, name="true_probability")


def generate_dataset(n_per_state: int = 260, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    frames = [_generate_points_for_state(s, n_per_state, rng) for s in STATE_BOUNDS]
    df = pd.concat(frames, ignore_index=True)
    label, prob = _synthesize_label(df, rng)
    df["manganese_prospectivity"] = label
    df["true_probability"] = prob
    df["target_id"] = ["MN-" + str(i).zfill(4) for i in range(1, len(df) + 1)]
    return df


def save_dataset(df: pd.DataFrame) -> Path:
    path = DATA_DIR / "exploration_dataset.csv"
    df.to_csv(path, index=False)
    return path


if __name__ == "__main__":
    df = generate_dataset()
    path = save_dataset(df)
    print(f"Generated {len(df)} synthetic exploration points -> {path}")
    print(df["manganese_prospectivity"].value_counts(normalize=True))
