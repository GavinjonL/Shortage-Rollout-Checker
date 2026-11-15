from fastapi.testclient import TestClient

from app.ai.client import MockPolicyExtractor
from app.main import app


def test_clean_reset_demo_walkthrough_uses_shared_fictional_data() -> None:
    client = TestClient(app)

    dataset = client.post("/api/demo/reset").json()
    assert len(dataset["events"]) >= 6

    mock_draft = MockPolicyExtractor().extract(
        "Fictional policy: MED-A is restricted. MED-B is the approved alternative.",
        dataset["policy"]["id"],
    )
    assert mock_draft.rules

    confirmed = client.put("/api/policies/confirmed", json={"rules": dataset["policy"]["rules"]})
    assert confirmed.status_code == 200

    rollout = client.get("/api/rollout/findings")
    assert rollout.status_code == 200
    assert rollout.json()["findings"]

    cases = client.get("/api/simulator/cases")
    assert cases.status_code == 200
    assert cases.json()
    simulated = client.post(f"/api/simulator/cases/{cases.json()[0]['test_case']['id']}/run", json={"configuration_override": None})
    assert simulated.status_code == 200

    ripple = client.get("/api/ripple/projection?shift_percent=30")
    assert ripple.status_code == 200
    assert ripple.json()["primary"]["projection"]

    shadow = client.get("/api/shadow/findings?window_hours=24")
    assert shadow.status_code == 200
    assert shadow.json()["findings"]
