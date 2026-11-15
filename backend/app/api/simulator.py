"""Deterministic flight simulation endpoints."""

from fastapi import APIRouter

from app.services.flight_simulator import run_sample_cases
from app.services.policy_store import get_confirmed_rules

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.get("/cases")
def sample_cases() -> dict:
    rules = get_confirmed_rules()
    return {"cases": run_sample_cases(rules), "confirmed_rule_count": len(rules), "simulation_only": True}
