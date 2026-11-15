import json

import httpx
import pytest
from fastapi.testclient import TestClient
from openai import RateLimitError

from app.ai.client import AISettings, OpenAICompatiblePolicyExtractor, PolicyExtractionError, _validate_evidence, get_policy_extractor
from app.api.policies import policy_extractor_dependency
from app.main import app
from app.schemas.policy import PolicyDraft

POLICY = "MED-A is restricted to DEPT-ER effective 2026-11-15. MED-B is the approved alternative for MED-A."
VALID_RULE = {
    "medication_id": "MED-A", "department_id": "DEPT-ER", "condition": None,
    "restriction": "restricted", "approved_alternative_id": "MED-B",
    "effective_date": "2026-11-15",
    "source_excerpt": "MED-A is restricted to DEPT-ER effective 2026-11-15. MED-B is the approved alternative for MED-A.",
    "confirmed_by_user": False,
}


class FakeCompletion:
    def __init__(self, payload):
        self.choices = [type("Choice", (), {"message": type("Message", (), {"content": json.dumps(payload)})()})()]


class FakeClient:
    def __init__(self, response=None, error=None):
        self.chat = type("Chat", (), {"completions": self})()
        self.response, self.error = response, error

    def create(self, **kwargs):
        if self.error:
            raise self.error
        return self.response


def extractor_with(fake_client):
    extractor = OpenAICompatiblePolicyExtractor(AISettings("groq", "test-key", "openai/gpt-oss-120b", "https://example.test"))
    extractor.client = fake_client
    return extractor


def test_successful_extraction_preserves_excerpt_and_draft_status():
    draft = extractor_with(FakeClient(FakeCompletion({"rules": [VALID_RULE], "ambiguities": []}))).extract(POLICY, "policy-001")
    assert draft.policy_id == "policy-001"
    assert draft.is_draft is True
    assert draft.rules[0].confirmed_by_user is False
    assert draft.rules[0].source_excerpt in POLICY


def test_missing_credentials_is_a_clear_error():
    with pytest.raises(PolicyExtractionError, match="GROQ_API_KEY is not configured"):
        OpenAICompatiblePolicyExtractor(AISettings("groq", None, "openai/gpt-oss-120b"))


def test_invalid_model_response_is_rejected():
    with pytest.raises(PolicyExtractionError, match="invalid policy draft"):
        extractor_with(FakeClient(FakeCompletion({"rules": "not-a-list"}))).extract(POLICY, "policy-001")


def test_ambiguous_fields_can_be_null():
    rule = {**VALID_RULE, "department_id": None, "condition": None, "approved_alternative_id": None,
            "source_excerpt": "MED-A is restricted to DEPT-ER effective 2026-11-15."}
    draft = extractor_with(FakeClient(FakeCompletion({"rules": [rule], "ambiguities": ["Department applicability is unclear."]}))).extract(POLICY, "policy-001")
    assert draft.rules[0].department_id is None
    assert draft.ambiguities


def test_rate_limit_is_reported_without_retrying():
    request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    response = httpx.Response(429, request=request)
    error = RateLimitError("limit", response=response, body={"error": {"message": "limit"}})
    with pytest.raises(PolicyExtractionError) as raised:
        extractor_with(FakeClient(error=error)).extract(POLICY, "policy-001")
    assert raised.value.status_code == 429


def test_schema_forbids_confirmed_rules_and_extra_fields():
    with pytest.raises(Exception):
        PolicyDraft.model_validate({"policy_id": "p", "rules": [], "ambiguities": [], "is_draft": False})


def test_invented_alternative_is_removed_and_marked_for_review():
    invented = PolicyDraft.model_validate({"policy_id": "p", "rules": [{**VALID_RULE, "approved_alternative_id": "MED-X"}], "ambiguities": []})
    validated = _validate_evidence(invented, POLICY)
    assert validated.rules[0].approved_alternative_id is None
    assert "could not be verified" in validated.ambiguities[0]


def test_alternative_id_embedded_in_a_model_label_is_normalized_when_supported():
    labelled = PolicyDraft.model_validate({"policy_id": "p", "rules": [{**VALID_RULE, "approved_alternative_id": "MED-B (approved alternative)"}], "ambiguities": []})
    validated = _validate_evidence(labelled, POLICY)
    assert validated.rules[0].approved_alternative_id == "MED-B"


def test_extract_endpoint_returns_mocked_draft():
    class StubExtractor:
        def extract(self, policy_text, policy_id):
            return PolicyDraft.model_validate({"policy_id": policy_id, "rules": [VALID_RULE], "ambiguities": []})

    app.dependency_overrides[policy_extractor_dependency] = lambda: StubExtractor()
    try:
        response = TestClient(app).post("/api/policies/extract", json={"policy_id": "p", "policy_text": POLICY})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["rules"][0]["source_excerpt"] in POLICY


def test_extract_endpoint_validates_empty_policy_text():
    app.dependency_overrides[policy_extractor_dependency] = lambda: object()
    try:
        response = TestClient(app).post("/api/policies/extract", json={"policy_text": ""})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 422


def test_missing_credentials_endpoint_is_a_clear_503(monkeypatch):
    monkeypatch.setattr(
        AISettings,
        "from_environment",
        classmethod(lambda cls: AISettings("groq", None, "openai/gpt-oss-120b")),
    )
    response = TestClient(app).post("/api/policies/extract", json={"policy_text": POLICY})
    assert response.status_code == 503
    assert "GROQ_API_KEY" in response.json()["detail"]
