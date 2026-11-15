"""Deterministic, read-only Flight Simulator endpoints."""

from fastapi import APIRouter, HTTPException

from app.data.seed_demo import load_demo_data
from app.schemas.scenario import SimulationCaseDetail, SimulationRequest, SimulationResult, TestCase
from app.services.flight_simulator import evaluate_test_case, run_sample_cases
from app.services.generated_cases import list_generated_cases
from app.services.policy_store import get_confirmed_rules

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.get("/cases", response_model=list[SimulationCaseDetail])
def list_cases() -> list[SimulationCaseDetail]:
    dataset = load_demo_data()
    configurations = {configuration.id: configuration for configuration in dataset.configurations}
    cases = [*dataset.test_cases, *list_generated_cases()]
    return [SimulationCaseDetail(test_case=test_case, configuration=configurations.get(test_case.configuration_id)) for test_case in cases]


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
    dataset = load_demo_data()
    test_case = next((item for item in [*dataset.test_cases, *list_generated_cases()] if item.id == case_id), None)
    if test_case is None:
        raise HTTPException(status_code=404, detail="Fictional sample case not found.")
    rule = next((item for item in dataset.policy.rules if item.id == test_case.source_rule_id), None)
    if rule is None:
        raise HTTPException(status_code=422, detail="Sample case references a missing policy rule.")
    if not rule.confirmed_by_user:
        raise HTTPException(status_code=409, detail="Confirm the policy rule before running a simulation.")
    configuration = next((item for item in dataset.configurations if item.id == test_case.configuration_id), None)
    return evaluate_test_case(test_case, rule, configuration, request.configuration_override)
