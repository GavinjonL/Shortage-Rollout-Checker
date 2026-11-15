"""Deterministic projections using only approved fictional alternative links."""
from app.schemas.demo import DemoDataset

def _one(dataset: DemoDataset, shift_percent: float) -> dict:
    rule = next((r for r in dataset.policy.rules if r.confirmed_by_user and r.approved_alternative_id), None)
    if not rule: return {"projection": None, "reason": "No confirmed rule names an approved alternative."}
    link = next((l for l in dataset.alternatives if l.source_medication_id == rule.medication_id and l.alternative_medication_id == rule.approved_alternative_id and l.approved_by_role.strip()), None)
    if not link: return {"projection": None, "reason": "The supplied alternative is not an approved demo link."}
    target = next((i for i in dataset.inventory if i.medication_id == link.alternative_medication_id), None)
    if not target or target.average_daily_use <= 0 or target.quantity_on_hand < target.minimum_reserve: return {"projection": None, "reason": "Supplied inventory values are incomplete or invalid."}
    projected = target.average_daily_use * (1 + shift_percent / 100)
    usable = target.quantity_on_hand - target.minimum_reserve
    return {"projection": {"policy_rule_id": rule.id, "source_medication_id": link.source_medication_id, "alternative_medication_id": link.alternative_medication_id, "location_id": target.location_id, "shift_percent": shift_percent, "baseline_daily_use": target.average_daily_use, "projected_daily_use": projected, "quantity_on_hand": target.quantity_on_hand, "minimum_reserve": target.minimum_reserve, "usable_supply": usable, "days_above_reserve": usable / projected, "formula": "(quantity_on_hand - minimum_reserve) / projected_daily_use", "assumptions": ["Fictional inventory", "Pharmacist-approved alternative link", "Simulation only — not a clinical recommendation"]}, "reason": None}

def build_projection(dataset: DemoDataset, shift_percent: float = 30, comparison_shift_percent: float | None = None) -> dict:
    return {"primary": _one(dataset, shift_percent), "comparison": _one(dataset, comparison_shift_percent) if comparison_shift_percent is not None else None}
