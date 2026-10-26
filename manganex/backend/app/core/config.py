"""Application configuration."""

APP_NAME = "MANGANEX API"
APP_VERSION = "0.1.0-prototype"

# States available in this demo. Bounding boxes are coarse, for map framing
# only -- not surveyed administrative boundaries.
REGIONS = {
    "odisha": {"label": "Odisha", "center": [20.95, 84.9], "zoom": 7},
    "karnataka": {"label": "Karnataka", "center": [14.5, 75.7], "zoom": 7},
    "madhya_pradesh": {"label": "Madhya Pradesh", "center": [23.5, 79.5], "zoom": 6},
    "maharashtra": {"label": "Maharashtra", "center": [19.3, 76.5], "zoom": 6},
}

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
