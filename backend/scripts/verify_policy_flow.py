"""Manual live extraction and workflow verification in an isolated app process.

Run from backend: .venv/Scripts/python.exe scripts/verify_policy_flow.py
Makes ONE provider request; does not change a running server's policy state.
"""
import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app


def main():
    with TestClient(app) as client:
        status = client.get("/api/ai/status").json()
        if status["mode"] != "live":
            raise SystemExit("FAIL: offline mock mode cannot verify a real provider call.")
        text = (Path(__file__).resolve().parents[2] / "docs/sample-policy-api-test.txt").read_text()
        response = client.post("/api/policies/extract", json={"policy_id": "ZX-731", "policy_text": text})
        if response.status_code != 200:
            raise SystemExit(f"FAIL: extraction HTTP {response.status_code}: {response.text}")
        draft = response.json()
        extracted = next((r for r in draft["rules"] if r["medication_id"] == "med-a-iv" and r["department_id"] == "dept-emergency" and r["restriction"] and "restrict" in r["restriction"].lower()), None)
        if extracted is None:
            raise SystemExit(f"FAIL: model needs review: {json.dumps(draft)}")
        confirmed = {**extracted, "id": "ZX-731-rule", "policy_id": "ZX-731", "condition": extracted["condition"] or "Fictional shortage active", "confirmed_by_user": True}
        assert client.put("/api/policies/confirmed", json={"rules": [confirmed]}).status_code == 200
        findings = client.get("/api/rollout/findings").json()["findings"]
        assert len(findings) == 1, findings
        assert findings[0]["source_record_id"] == "ehr-demo-001"
        cases = client.get("/api/simulator/cases").json()
        assert cases
        assert client.post(f"/api/simulator/cases/{cases[0]['test_case']['id']}/run", json={}).status_code == 200
        assert client.get("/api/shadow/findings").json()["findings"]
        # A controlled confirmed-rule edit tests that rollout results follow input.
        other = {**confirmed, "department_id": "dept-infusion"}
        client.put("/api/policies/confirmed", json={"rules": [other]})
        assert client.get("/api/rollout/findings").json()["findings"] == []
        assert client.get("/api/shadow/findings").json()["findings"] == []
        assert client.get("/api/simulator/cases").json() == []
        client.put("/api/policies/confirmed", json={"rules": []})
        assert client.get("/api/ripple/projection").json()["primary"]["projection"] is None
        calls = client.get("/api/ai/status").json()["calls"]
        assert len(calls) == len(status["calls"]) + 1
        assert calls[-1]["status"] == "success"
        print(json.dumps({"result": "PASS", "provider": status["provider"], "model": status["model"], "provider_call": calls[-1], "matching_policy_findings": len(findings), "changed_department_findings": 0, "draft": draft}, indent=2))

if __name__ == "__main__":
    main()
