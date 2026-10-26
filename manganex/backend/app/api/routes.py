from __future__ import annotations
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import REGIONS
from app.services import exploration_service
from app.services.recommendation_engine import generate_recommendations
from app.ml import prospectivity_model, forecast_model

router = APIRouter()


# ---------------------------------------------------------------------------
# Health / meta
# ---------------------------------------------------------------------------

@router.get("/health")
def health():
    return {"status": "ok", "service": "manganex-api"}


@router.get("/regions")
def regions():
    return {"regions": exploration_service.get_regions()}


# ---------------------------------------------------------------------------
# Exploration
# ---------------------------------------------------------------------------

@router.get("/exploration/targets")
def exploration_targets(state: str = Query("odisha"), limit: int = Query(20, ge=1, le=100)):
    if state not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{state}'")
    targets = exploration_service.get_targets(state, limit=limit)
    return {"state": state, "count": len(targets), "targets": targets, "label": "Prototype / Sample Data"}


@router.get("/exploration/heatmap")
def exploration_heatmap(state: str = Query("odisha"), grid_size: int = Query(22, ge=5, le=60)):
    if state not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{state}'")
    return exploration_service.get_heatmap(state, grid_size=grid_size)


@router.get("/exploration/target/{target_id}")
def exploration_target_detail(target_id: str):
    detail = exploration_service.get_target_detail(target_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Target '{target_id}' not found")
    return detail


class PredictRequest(BaseModel):
    red: float = Field(..., ge=0, le=1)
    green: float = Field(..., ge=0, le=1)
    blue: float = Field(..., ge=0, le=1)
    nir: float = Field(..., ge=0, le=1)
    swir1: float = Field(..., ge=0, le=1)
    swir2: float = Field(..., ge=0, le=1)
    ndvi: float = Field(..., ge=-1, le=1)
    ndwi: float = Field(..., ge=-1, le=1)
    elevation: float
    slope: float = Field(..., ge=0)
    geology_score: float = Field(..., ge=0, le=1)
    iron_oxide_index: float = Field(..., ge=0, le=1)
    distance_to_occurrence: float = Field(..., ge=0)


@router.post("/exploration/predict")
def exploration_predict(payload: PredictRequest):
    """Run the trained model on an arbitrary caller-supplied feature vector
    (e.g. a manually adjusted 'what-if' set of spectral/geological inputs).
    """
    feats = payload.model_dump()
    prob = prospectivity_model.predict_proba(feats)
    explanation = prospectivity_model.explain_prediction(feats)
    return {
        "prospectivity": round(prob, 4),
        "priority": exploration_service._priority_for(prob),
        "explanation": explanation,
        "label": "Prototype / Sample Data",
    }


# ---------------------------------------------------------------------------
# ML model metadata
# ---------------------------------------------------------------------------

@router.get("/model/metrics")
def model_metrics():
    bundle = prospectivity_model.get_bundle()
    return bundle.metrics


@router.get("/model/feature-importance")
def model_feature_importance():
    bundle = prospectivity_model.get_bundle()
    return {"feature_importance": bundle.feature_importance}


# ---------------------------------------------------------------------------
# Production / supply risk
# ---------------------------------------------------------------------------

@router.get("/production/history")
def production_history(months: int = Query(24, ge=1, le=60)):
    bundle = forecast_model.get_bundle()
    df = bundle.df.tail(months).copy()
    df["date"] = df["date"].dt.strftime("%Y-%m")
    cols = [
        "date", "production_mt", "demand_mt", "supply_gap_mt",
        "ore_grade_pct", "recovery_rate_pct", "mine_utilization_pct",
        "equipment_downtime_pct", "rainfall_impact_index",
        "logistics_disruption_index", "inventory_mt",
    ]
    return {"history": df[cols].to_dict(orient="records"), "label": "Prototype / Sample Data"}


@router.get("/production/status")
def production_status():
    return forecast_model.current_status()


@router.get("/production/forecast")
def production_forecast(months_ahead: int = Query(12, ge=1, le=24)):
    rows = forecast_model.forecast(months_ahead=months_ahead)
    return {"forecast": rows, "months_ahead": months_ahead, "label": "Prototype / Sample Data"}


class ScenarioRequest(BaseModel):
    name: str = "Custom Scenario"
    mine_utilization_pct: float = Field(0.0, description="Relative change, e.g. 0.10 = +10%")
    recovery_rate_pct: float = Field(0.0, description="Relative change")
    ore_grade_pct: float = Field(0.0, description="Relative change")
    equipment_downtime_pct: float = Field(0.0, description="Relative change (negative = less downtime)")
    demand_growth_pct: float = Field(0.0, description="Relative change to forecast demand")
    exploration_success_rate: float = Field(0.0, description="Extra production capacity fraction from newly validated targets")
    new_mine_capacity_mt: float = Field(0.0, description="Absolute Mt/month bonus from a new mine coming online")
    months_ahead: int = Field(12, ge=1, le=24)


@router.post("/production/scenario")
def production_scenario(payload: ScenarioRequest):
    overrides = payload.model_dump(exclude={"name", "months_ahead"})
    result = forecast_model.run_scenario(payload.name, overrides, months_ahead=payload.months_ahead)
    return result


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

@router.get("/recommendations")
def recommendations(state: str = Query("odisha")):
    if state not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{state}'")
    targets = exploration_service.get_targets(state, limit=10)
    status = forecast_model.current_status()
    fc = forecast_model.forecast(months_ahead=6)
    recs = generate_recommendations(targets, status, fc)
    return {"state": state, "recommendations": recs, "label": "Prototype / Sample Data"}
