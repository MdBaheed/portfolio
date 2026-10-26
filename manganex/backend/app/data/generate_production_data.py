"""
Synthetic manganese production/demand history generator.

Generates monthly time series (default 60 months / 5 years) of production,
demand, ore grade, recovery rate, mine utilization, downtime, weather
impact and logistics disruption. Values are procedurally generated with
seasonality + trend + noise to resemble real supply-chain telemetry, but
are entirely synthetic ("Prototype / Sample Data").

REPLACING WITH REAL DATA LATER
-------------------------------
Swap the generator's output for actual monthly returns from:
  - Ministry of Mines / IBM (Indian Bureau of Mines) production statistics
  - Company-level production reports (MOIL, etc.)
  - Steel/battery industry demand forecasts (worldsteel, industry bodies)
The forecasting model in ml/forecast_model.py consumes a flat dataframe
with these exact column names, so no other code needs to change.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).parent / "generated"
DATA_DIR.mkdir(exist_ok=True)


def generate_production_history(months: int = 60, seed: int = 7) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    end = datetime(2026, 8, 1)
    dates = pd.date_range(end=end, periods=months, freq="MS")

    t = np.arange(months)
    seasonality = 0.08 * np.sin(2 * np.pi * t / 12)

    # Operational drivers first -- production is then computed CAUSALLY from
    # these, so a downstream regression model (and the scenario simulator)
    # learns a meaningful, interpretable relationship rather than fitting
    # noise.
    ore_grade = np.clip(rng.normal(34, 2.2, months), 25, 45)  # % Mn
    recovery_rate = np.clip(rng.normal(78, 4, months), 55, 92)  # %
    mine_utilization = np.clip(rng.normal(80, 5, months), 45, 98)  # %
    equipment_downtime = np.clip(rng.normal(6, 3, months), 0, 25)  # % of days
    rainfall_impact = np.clip(
        (0.5 + 0.5 * np.sin(2 * np.pi * (t % 12) / 12 - np.pi / 2)) * rng.uniform(0.6, 1.2, months),
        0, 1.2,
    )  # monsoon disruption index, peaks mid-year
    logistics_disruption = np.clip(rng.exponential(0.18, months), 0, 1.5)

    # Theoretical (nameplate) capacity grows slowly over time (mild capex
    # trend), then actual production is capacity scaled down by
    # utilization, recovery, downtime, rainfall and logistics frictions.
    nameplate_capacity = 0.31 + 0.0010 * t
    production = (
        nameplate_capacity
        * (mine_utilization / 100)
        * (recovery_rate / 100)
        * (1 - 0.9 * equipment_downtime / 100)
        * (1 - 0.10 * rainfall_impact)
        * (1 - 0.06 * logistics_disruption)
        * (1 + seasonality)
        + rng.normal(0, 0.004, months)
    )
    production = np.clip(production, 0.08, None)

    # Demand: steeper structural growth (steel + battery demand), some
    # volatility, largely independent of the mine's own operating
    # conditions.
    base_demand = 0.170 + 0.0016 * t
    demand = base_demand * (1 + 0.6 * seasonality) + rng.normal(0, 0.007, months)
    demand = np.clip(demand, 0.12, None)

    inventory = np.clip(
        2.1 + np.cumsum(production - demand) + rng.normal(0, 0.03, months), 0.2, None
    )

    df = pd.DataFrame({
        "date": dates,
        "production_mt": production,
        "demand_mt": demand,
        "ore_grade_pct": ore_grade,
        "recovery_rate_pct": recovery_rate,
        "mine_utilization_pct": mine_utilization,
        "equipment_downtime_pct": equipment_downtime,
        "rainfall_impact_index": rainfall_impact,
        "logistics_disruption_index": logistics_disruption,
        "inventory_mt": inventory,
    })
    df["supply_gap_mt"] = df["demand_mt"] - df["production_mt"]
    return df


def save_dataset(df: pd.DataFrame) -> Path:
    path = DATA_DIR / "production_history.csv"
    df.to_csv(path, index=False)
    return path


if __name__ == "__main__":
    df = generate_production_history()
    path = save_dataset(df)
    print(f"Generated {len(df)} months of synthetic production history -> {path}")
    print(df.tail())
