"""Regression checks for policy-sensitive endpoints; no external requests."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.data.seed_demo import load_demo_data, reset_demo_data, replace_demo_table
from app.services.policy_store import replace_confirmed_rules
from app.ai.client import MockPolicyExtractor

@pytest.fixture(autouse=True)
def isolated_policy():
    reset_demo_data()
    replace_confirmed_rules([])
    yield
    reset_demo_data()
    replace_confirmed_rules([])


def rule():
    return load_demo_data().policy.rules[0].model_copy(update={"id": "unique-policy-rule"}).model_dump()


def test_workflows_use_current_confirmation_and_clear_without_seed_fallback():
    client = TestClient(app)
    assert client.get("/api/rollout/findings").json()["findings"] == []
    assert client.get("/api/simulator/cases").json() == []
    assert client.get("/api/shadow/findings").json()["findings"] == []
    assert client.get("/api/ripple/projection").json()["primary"]["projection"] is None
    assert client.put("/api/policies/confirmed", json={"rules": [rule()]}).status_code == 200
    findings = client.get("/api/rollout/findings").json()["findings"]
    assert len(findings) == 1
    assert findings[0]["policy_rule_id"] == "unique-policy-rule"
    assert client.get("/api/shadow/findings").json()["findings"][0]["policy_rule_id"] == "unique-policy-rule"
    assert client.get("/api/ripple/projection").json()["primary"]["projection"]["policy_rule_id"] == "unique-policy-rule"
    cases = client.get("/api/simulator/cases").json()
    result = client.post(f"/api/simulator/cases/{cases[0]['test_case']['id']}/run", json={})
    assert result.json()["rule_id"] == "unique-policy-rule"
    other = {**rule(), "department_id": "dept-no-matching-record"}
    client.put("/api/policies/confirmed", json={"rules": [other]})
    assert client.get("/api/rollout/findings").json()["findings"] == []
    assert client.get("/api/shadow/findings").json()["findings"] == []
    assert client.get("/api/simulator/cases").json() == []
    assert client.post(f"/api/simulator/cases/{cases[0]['test_case']['id']}/run", json={}).status_code == 404
    assert client.put("/api/policies/confirmed", json={"rules": []}).status_code == 200
    assert client.get("/api/ripple/projection").json()["primary"]["projection"] is None


def test_rollout_uses_imported_configuration_and_unique_rule_evidence():
    client = TestClient(app)
    client.put("/api/policies/confirmed", json={"rules": [rule(), {**rule(), "id": "second-rule"}]})
    findings = client.get("/api/rollout/findings").json()["findings"]
    assert len({f["id"] for f in findings}) == 2
    configs = [c.model_dump() for c in load_demo_data().configurations]
    configs[0]["instruction_text"] = "Restricted; current shortage guidance."
    replace_demo_table("configurations", configs)
    assert client.get("/api/rollout/findings").json()["findings"] == []


def test_reopening_rule_and_reset_clear_active_rules():
    client = TestClient(app)
    client.put("/api/policies/confirmed", json={"rules": [rule()]})
    client.post("/api/policies/rules/review", json={"rule_id": rule()["id"], "policy_id": "p", "status": "Draft", "source_excerpt": "fictional"})
    assert client.get("/api/policies/confirmed").json() == []
    client.put("/api/policies/confirmed", json={"rules": [rule()]})
    client.post("/api/demo/reset")
    assert client.get("/api/policies/confirmed").json() == []


def test_status_does_not_send_requests_or_expose_credentials(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "secret-do-not-return")
    response = TestClient(app).get("/api/ai/status")
    assert response.json()["mode"] == "live"
    assert response.json()["key_configured"] is True
    assert "secret-do-not-return" not in response.text


def test_mock_does_not_invent_missing_identifiers():
    draft = MockPolicyExtractor().extract("Fictional policy with no identifiers.", "p")
    assert draft.rules[0].medication_id is None
    assert draft.rules[0].department_id is None
    assert draft.rules[0].approved_alternative_id is None
    assert draft.rules[0].effective_date is None


def test_report_explains_why_two_previous_samples_share_one_finding():
    client = TestClient(app)
    first = rule()
    client.put("/api/policies/confirmed", json={"rules": [first]})
    one = client.get("/api/rollout/findings").json()
    reserve = {**first, "id": "reserve-rule", "medication_id": "med-c-reserve", "department_id": "dept-infusion",
               "approved_alternative_id": None, "source_excerpt": "Restrict med-c-reserve in dept-infusion."}
    client.put("/api/policies/confirmed", json={"rules": [first, reserve]})
    two = client.get("/api/rollout/findings").json()
    assert len(one["findings"]) == len(two["findings"]) == 1
    assert one["policy_fingerprint"] != two["policy_fingerprint"]
    assert len(two["rule_reviews"]) == 2
    assert two["rule_reviews"][1]["outcome"] == "Needs clarification"
    assert two["rule_reviews"][1]["records"][0]["source_record_id"] == "pump-demo-001"
    assert two["rule_reviews"][1]["records"][0]["instruction_text"] == "Fictional reserve medication guidance is current."
    client.put("/api/policies/confirmed", json={"rules": [reserve]})
    reserve_only = client.get("/api/rollout/findings").json()
    assert reserve_only["findings"] == []
    assert reserve_only["rule_reviews"][0]["outcome"] == "Needs clarification"
    assert reserve_only["rule_reviews"][0]["rule"]["medication_id"] == "med-c-reserve"


def test_unsupported_and_missing_records_are_explicit_and_unrestricted_is_not_restriction():
    client = TestClient(app)
    client.put("/api/policies/confirmed", json={"rules": [{**rule(), "restriction": "Unrestricted use"}]})
    report = client.get("/api/rollout/findings").json()
    assert report["findings"] == []
    assert report["rule_reviews"][0]["outcome"] == "Not evaluated"
    client.put("/api/policies/confirmed", json={"rules": [{**rule(), "department_id": "unknown"}]})
    report = client.get("/api/rollout/findings").json()
    assert report["findings"] == []
    assert report["rule_reviews"][0]["outcome"] == "No matching records"


def test_two_policy_samples_have_distinct_results_in_all_four_workflows():
    client = TestClient(app)
    samples = client.get("/api/demo/policy-samples").json()["samples"]
    assert len(samples) == 2
    assert "med-b-oral" in samples[0]["policy_text"]
    assert "No alternative is approved" in samples[1]["policy_text"]
    client.post("/api/demo/reset")
    results = []
    for index, sample in enumerate(samples):
        candidate = {**rule(), "source_excerpt": sample["policy_text"]}
        if index:
            candidate.update(medication_id="med-c-reserve", department_id="dept-infusion", approved_alternative_id=None)
        client.put("/api/policies/confirmed", json={"rules": [candidate]})
        rollout = client.get("/api/rollout/findings").json()
        cases = client.get("/api/simulator/cases").json()
        statuses = [client.post(f"/api/simulator/cases/{case['test_case']['id']}/run", json={}).json()["status"] for case in cases]
        ripple = client.get("/api/ripple/projection?shift_percent=30").json()["primary"]
        shadow = client.get("/api/shadow/findings").json()["findings"]
        results.append((rollout, statuses, ripple, shadow))
    first, second = results
    assert len(first[0]["findings"]) == 1
    assert first[1] == ["Pass", "Possible mismatch", "Needs clarification"]
    assert first[2]["projection"]["projected_daily_use"] == 13
    assert first[2]["projection"]["days_above_reserve"] == pytest.approx(60 / 13)
    assert len(first[3]) == 1
    assert second[0]["findings"] == []
    assert second[0]["rule_reviews"][0]["outcome"] == "Needs clarification"
    assert second[1] == []
    assert second[2]["projection"] is None
    assert second[3] == []
