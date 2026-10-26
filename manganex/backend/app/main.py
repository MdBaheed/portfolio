"""
MANGANEX API entrypoint.

Run with:
    uvicorn app.main:app --reload --port 8000

On startup, trains the prospectivity model and the forecast models once
(in-memory) so all requests are served from cached model bundles rather
than retraining per-request.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import APP_NAME, APP_VERSION, CORS_ORIGINS
from app.api.routes import router
from app.ml import prospectivity_model, forecast_model

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "AI/ML + Space Technology enabled manganese exploration prospectivity "
        "and production shortfall prediction platform. All exploration and "
        "production data in this prototype is SYNTHETIC ('Prototype / Sample "
        "Data') -- see /api/health and each endpoint's `label` field."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.on_event("startup")
def _train_models_on_startup():
    prospectivity_model.train_model()
    forecast_model.train_forecast_models()


@app.get("/")
def root():
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "docs": "/docs",
        "api_base": "/api",
    }
