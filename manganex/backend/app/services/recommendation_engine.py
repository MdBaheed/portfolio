"""
Rule-based recommendation engine.

Generates action recommendations FROM the actual current dashboard state
(top exploration targets + current supply risk) rather than static text,
per the prompt's requirement that recommendations reflect live
dashboard values.
"""
from __future__ import annotations
from typing import Any


def generate_recommendations(
    top_targets: list[dict[str, Any]],
    supply_status: dict[str, Any],
    forecast_rows: list[dict[str, Any]],
) -> list[dict[str, str]]:
    recs: list[dict[str, str]] = []

    if top_targets:
        best = top_targets[0]
        recs.append({
            "priority": "HIGH",
            "action": (
                f"Prioritize target {best['target_id']} "
                f"({round(best['prospectivity'] * 100)}% prospectivity, "
                f"{best['priority']} exploration priority) for field validation "
                f"and ground-truth sampling."
            ),
        })
        high_count = sum(1 for t in top_targets if t["priority"] == "HIGH")
        if high_count > 1:
            recs.append({
                "priority": "HIGH",
                "action": (
                    f"Conduct detailed geophysical surveys across the "
                    f"{high_count} high-prospectivity zones identified in this region "
                    f"before committing drilling budget."
                ),
            })

    gap = supply_status.get("supply_gap_mt", 0)
    risk = supply_status.get("risk_level", "LOW")
    demand = supply_status.get("demand_mt", 1e-6)
    gap_fraction = gap / max(demand, 1e-6)

    if risk in ("HIGH", "MODERATE"):
        recs.append({
            "priority": risk,
            "action": (
                f"Current supply gap is {gap:.3f} Mt ({gap_fraction*100:.1f}% of demand). "
                f"Increase inventory buffer and prioritize beneficiation/recovery-rate "
                f"improvements at existing processing facilities."
            ),
        })

    worsening = False
    if len(forecast_rows) >= 2:
        worsening = forecast_rows[-1]["supply_gap_mt"] > forecast_rows[0]["supply_gap_mt"]
    if worsening:
        recs.append({
            "priority": "MODERATE",
            "action": (
                "The supply gap is projected to widen over the forecast horizon. "
                "Accelerate exploration-to-production timelines for high-prospectivity "
                "targets with favorable infrastructure access to bring new capacity online sooner."
            ),
        })
    else:
        recs.append({
            "priority": "LOW",
            "action": (
                "The supply gap is projected to narrow under current operating trends. "
                "Maintain current exploration and production cadence while monitoring "
                "monsoon-season disruption risk."
            ),
        })

    if any(t["priority"] == "MEDIUM" for t in top_targets):
        recs.append({
            "priority": "MEDIUM",
            "action": (
                "Schedule follow-up spectral/geological review for medium-priority "
                "targets to confirm whether they warrant promotion to high priority."
            ),
        })

    return recs
