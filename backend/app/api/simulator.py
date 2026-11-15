"""Deterministic, read-only Flight Simulator endpoints."""

from fastapi import APIRouter, HTTPException

from app.schemas.scenario import SimulationCaseDetail, SimulationRequest, SimulationResult, TestCase
from app.services.flight_simulator import evaluate_test_case, run_sample_cases, confirmed_simulation_cases
from app.services.policy_store import get_confirmed_rules

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.get("/cases", response_model=list[SimulationCaseDetail])
def list_cases() -> list[SimulationCaseDetail]:
    return [case for case, _ in confirmed_simulation_cases(get_confirmed_rules())]


@router.get("/confirmed-cases")
def confirmed_sample_cases() -> dict:
    rules = get_confirmed_rules()
    return {"cases": run_sample_cases(rules), "confirmed_rule_count": len(rules), "simulation_only": True}


@router.post("/validate", response_model=TestCase)
def validate_case(test_case: TestCase) -> TestCase:
    """Validate a generated case before it is made available for a simulation."""
    return test_case


@router.post("/cases/{case_id}/run", response_model=SimulationResult)
def run_case(case_id: str, request: SimulationRequest) -> SimulationResult:
    match = next(((case, rule) for case, rule in confirmed_simulation_cases(get_confirmed_rules()) if case.test_case.id == case_id), None)
    if match is None:
        raise HTTPException(status_code=404, detail="No sample case matches the current confirmed policy. Reload cases after confirming rules.")
    case, rule = match
    return evaluate_test_case(case.test_case, rule, case.configuration, request.configuration_override)
