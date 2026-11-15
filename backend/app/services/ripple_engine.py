"""Calculate transparent fictional inventory projections."""
import json
from pathlib import Path

from app.schemas.policy import PolicyRule

_FIXTURE = Path(__file__).parent.parent / "data" / "fixtures" / "inventory.json"


def build_projection(rules: list[PolicyRule], shift_percent: float = 30) -> dict:
    if not rules:
        return {"projection": None, "reason": "No confirmed policy rules."}
    rule = next((r for r in rules if r.approved_alternative_id), None)
    if not rule:
        return {"projection": None, "reason": "No confirmed approved alternative."}
    inventory = json.loads(_FIXTURE.read_text(encoding="utf-8"))
    target = next((row for row in inventory if row["medication_id"].casefold() == rule.approved_alternative_id.casefold()), None)
    if not target or target["average_daily_use"] <= 0 or target["quantity_on_hand"] < target["minimum_reserve"]:
        return {"projection": None, "reason": "Supplied inventory values are incomplete or invalid."}
    shifted = target["average_daily_use"] * (1 + shift_percent / 100)
    usable = target["quantity_on_hand"] - target["minimum_reserve"]
    return {"projection": {"policy_rule_id": rule.id, "source_medication_id": rule.medication_id,
        "alternative_medication_id": rule.approved_alternative_id, "location_id": target["location_id"],
        "shift_percent": shift_percent, "baseline_daily_use": target["average_daily_use"],
        "projected_daily_use": shifted, "quantity_on_hand": target["quantity_on_hand"],
        "minimum_reserve": target["minimum_reserve"], "days_above_reserve": usable / shifted,
        "formula": "(quantity_on_hand - minimum_reserve) / projected_daily_use"}, "reason": None}
