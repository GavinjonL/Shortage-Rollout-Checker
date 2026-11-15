from fastapi.testclient import TestClient

from app.data.seed_demo import load_demo_data
from app.main import app
from app.schemas.scenario import ConfigurationOverride
from app.services.flight_simulator import evaluate_test_case


def _case(case_id: str):
    dataset = load_demo_data()
    test_case = next(item for item in dataset.test_cases if item.id == case_id)
    rule = next(item for item in dataset.policy.rules if item.id == test_case.source_rule_id)
    configuration = next(item for item in dataset.configurations if item.id == test_case.configuration_id)
    return test_case, rule, configuration


def test_seeded_cases_have_reproducible_expected_results() -> None:
    assert evaluate_test_case(*_case("test-001")).status == "Pass"
    assert evaluate_test_case(*_case("test-002")).status == "Possible mismatch"
    assert evaluate_test_case(*_case("test-003")).status == "Needs clarification"


def test_configuration_override_can_resolve_a_mock_mismatch() -> None:
    test_case, rule, configuration = _case("test-002")
    result = evaluate_test_case(
        test_case,
        rule,
        configuration,
        ConfigurationOverride(instruction_text="MED-A restricted; display current shortage guidance and contraindication handling."),
    )
    assert result.status == "Pass"


def test_simulator_endpoints_list_validated_cases_and_run_them() -> None:
    client = TestClient(app)
    client.put("/api/policies/confirmed", json={"rules": [r.model_dump() for r in load_demo_data().policy.rules]})
    cases = client.get("/api/simulator/cases")
    assert cases.status_code == 200
    assert len(cases.json()) == 3

    result = client.post(f"/api/simulator/cases/{cases.json()[0]['test_case']['id']}/run", json={"configuration_override": None})
    assert result.status_code == 200
    assert result.json()["status"] == "Pass"
