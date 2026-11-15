from fastapi.testclient import TestClient

from app.ai.tools import dispatch_read_only_tool
from app.main import app


def _rule() -> dict:
    return {"id": "review-rule-001", "policy_id": "policy-review", "medication_id": "med-a-iv", "department_id": "dept-emergency", "condition": "Fictional shortage flag is active.", "restriction": "Restrict use", "approved_alternative_id": "med-b-oral", "effective_date": "2026-11-15", "source_excerpt": "Fictional MED-A policy excerpt.", "confirmed_by_user": False}


def test_mock_ai_check_and_extraction_are_safe_and_confirmable(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "mock")
    client = TestClient(app)
    assert client.post("/api/ai/check").json() == {"ok": True, "provider": "mock", "mode": "offline"}
    text = "MED-A is restricted in DEPT-ER effective 2026-11-15. MED-B is approved."
    draft = client.post("/api/policies/extract", json={"policy_id": "p", "policy_text": text})
    assert draft.status_code == 200
    assert draft.json()["rules"][0]["source_excerpt"] in text
    confirmed = client.put("/api/policies/confirmed", json={"rules": [_rule()]})
    assert confirmed.status_code == 200
    assert confirmed.json()[0]["confirmed_by_user"] is True


def test_policy_review_persists_history_and_tools_remain_read_only():
    client = TestClient(app)
    review = {"rule_id": "review-rule-001", "policy_id": "policy-review", "status": "Confirmed", "title": "Fictional rule", "source_excerpt": "Fictional MED-A policy excerpt."}
    assert client.post("/api/policies/rules/review", json=review).status_code == 200
    assert any(item["rule_id"] == review["rule_id"] for item in client.get("/api/policies/rules/review").json()["rules"])
    assert client.get("/api/policies/history").json()["versions"]
    assert dispatch_read_only_tool("build_ripple_projection", {})["primary"]
    assert dispatch_read_only_tool("get_shadow_events", {})["read_only"] is True
