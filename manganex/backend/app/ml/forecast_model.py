"""
Production / demand forecasting model.

Uses a transparent regression approach (per SIH prompt guidance: a full
time-series model is not required) built on top of scikit-learn's
LinearRegression with engineered trend + seasonality features. This keeps
the model auditable and fast, while still producing a defensible 6-12
month forward forecast plus a scenario simulator for "what-if" analysis.

Two models are trained:
  - production model: production_mt ~ trend, seasonality, ore_grade,
    recovery_rate, mine_utilization, equipment_downtime, rainfall_impact,
    logistics_disruption
  - demand model: demand_mt ~ trend, seasonality

The scenario simulator re-runs the production model with user-adjusted
inputs (e.g. +10% mine utilization) and the demand model with a
user-supplied demand growth rate, then recomputes supply gap + risk.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from app.data.generate_production_data import generate_production_history, DATA_DIR

PRODUCTION_FEATURES = [
    "t", "seasonality",
    "ore_grade_pct", "recovery_rate_pct", "mine_utilization_pct",
    "equipment_downtime_pct", "rainfall_impact_index", "logistics_disruption_index",
]
DEMAND_FEATURES = ["t", "seasonality"]

RISK_THRESHOLDS = {"low": 0.05, "moderate": 0.15}  # supply gap as fraction of demand


@dataclass
class ForecastBundle:
    df: pd.DataFrame
    production_model: LinearRegression
    demand_model: LinearRegression
    last_t: int


_bundle: ForecastBundle | None = None


def _load_or_generate() -> pd.DataFrame:
    path = DATA_DIR / "production_history.csv"
    if path.exists():
        df = pd.read_csv(path, parse_dates=["date"])
    else:
        df = generate_production_history()
        df.to_csv(path, index=False)
    df = df.reset_index(drop=True)
    df["t"] = np.arange(len(df))
    df["seasonality"] = np.sin(2 * np.pi * df["t"] / 12)
    return df


def train_forecast_models() -> ForecastBundle:
    global _bundle
    df = _load_or_generate()

    prod_model = LinearRegression().fit(df[PRODUCTION_FEATURES], df["production_mt"])
    demand_model = LinearRegression().fit(df[DEMAND_FEATURES], df["demand_mt"])

    _bundle = ForecastBundle(
        df=df, production_model=prod_model, demand_model=demand_model,
        last_t=int(df["t"].max()),
    )
    return _bundle


def get_bundle() -> ForecastBundle:
    if _bundle is None:
        return train_forecast_models()
    return _bundle


def _risk_level(gap_fraction: float) -> str:
    if gap_fraction <= RISK_THRESHOLDS["low"]:
        return "LOW"
    if gap_fraction <= RISK_THRESHOLDS["moderate"]:
        return "MODERATE"
    return "HIGH"


def current_status() -> dict[str, Any]:
    bundle = get_bundle()
    latest = bundle.df.iloc[-1]
    gap = float(latest["demand_mt"] - latest["production_mt"])
    gap_fraction = gap / max(latest["demand_mt"], 1e-6)
    return {
        "date": latest["date"].strftime("%Y-%m"),
        "production_mt": round(float(latest["production_mt"]), 4),
        "demand_mt": round(float(latest["demand_mt"]), 4),
        "supply_gap_mt": round(gap, 4),
        "risk_level": _risk_level(gap_fraction),
        "label": "Prototype / Sample Data",
    }


def forecast(months_ahead: int = 12, overrides: dict[str, float] | None = None) -> list[dict[str, Any]]:
    """Forecast production & demand for `months_ahead` months using the
    average of the last 6 months' operating conditions as the baseline,
    optionally adjusted by `overrides` (fractional deltas), e.g.
    {"mine_utilization_pct": +0.10} = 10% relative improvement.
    """
    bundle = get_bundle()
    df = bundle.df
    overrides = overrides or {}

    recent = df.tail(6)
    baseline = {
        "ore_grade_pct": recent["ore_grade_pct"].mean(),
        "recovery_rate_pct": recent["recovery_rate_pct"].mean(),
        "mine_utilization_pct": recent["mine_utilization_pct"].mean(),
        "equipment_downtime_pct": recent["equipment_downtime_pct"].mean(),
        "rainfall_impact_index": recent["rainfall_impact_index"].mean(),
        "logistics_disruption_index": recent["logistics_disruption_index"].mean(),
    }
    for key in [
        "ore_grade_pct", "recovery_rate_pct", "mine_utilization_pct",
        "equipment_downtime_pct", "rainfall_impact_index", "logistics_disruption_index",
    ]:
        if key in overrides:
            baseline[key] = baseline[key] * (1 + overrides[key])

    demand_growth_override = overrides.get("demand_growth_pct", 0.0)
    exploration_success_bonus = overrides.get("exploration_success_rate", 0.0)  # extra production capacity fraction
    new_mine_bonus_mt = overrides.get("new_mine_capacity_mt", 0.0)

    results = []
    for i in range(1, months_ahead + 1):
        t = bundle.last_t + i
        seasonality = np.sin(2 * np.pi * t / 12)

        prod_row = pd.DataFrame([{**baseline, "t": t, "seasonality": seasonality}])[PRODUCTION_FEATURES]
        production = float(bundle.production_model.predict(prod_row)[0])
        production *= (1 + exploration_success_bonus)
        production += new_mine_bonus_mt

        demand_row = pd.DataFrame([{"t": t, "seasonality": seasonality}])[DEMAND_FEATURES]
        demand = float(bundle.demand_model.predict(demand_row)[0])
        demand *= (1 + demand_growth_override)

        production = max(production, 0.0)
        demand = max(demand, 0.0)
        gap = demand - production
        gap_fraction = gap / max(demand, 1e-6)

        month_label = (df["date"].iloc[-1] + pd.DateOffset(months=i)).strftime("%Y-%m")
        results.append({
            "date": month_label,
            "production_mt": round(production, 4),
            "demand_mt": round(demand, 4),
            "supply_gap_mt": round(gap, 4),
            "risk_level": _risk_level(gap_fraction),
        })
    return results


def run_scenario(name: str, overrides: dict[str, float], months_ahead: int = 12) -> dict[str, Any]:
    fc = forecast(months_ahead=months_ahead, overrides=overrides)
    avg_gap = float(np.mean([r["supply_gap_mt"] for r in fc]))
    avg_demand = float(np.mean([r["demand_mt"] for r in fc]))
    gap_fraction = avg_gap / max(avg_demand, 1e-6)
    return {
        "scenario_name": name,
        "overrides": overrides,
        "forecast": fc,
        "avg_supply_gap_mt": round(avg_gap, 4),
        "risk_level": _risk_level(gap_fraction),
    }


if __name__ == "__main__":
    train_forecast_models()
    print("Current status:", current_status())
    print("\n12-month baseline forecast (first 3 rows):")
    for row in forecast(12)[:3]:
        print(" ", row)

    print("\nScenario B: +10% production improvement")
    print(run_scenario("10% Production Improvement", {"mine_utilization_pct": 0.10, "recovery_rate_pct": 0.05}))
