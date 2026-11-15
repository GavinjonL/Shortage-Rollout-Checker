from fastapi.testclient import TestClient

from app.data.seed_demo import load_demo_data
from app.main import app
from app.services.ripple_engine import build_projection
from app.services.shadow_analyzer import analyze_events


def test_ripple_projection_requires_approved_link_and_compares_scenarios() -> None:
    result = build_projection(load_demo_data(), 30, 60)
    assert result["primary"]["reason"] is None
    assert result["comparison"]["projection"]["projected_daily_use"] > result["primary"]["projection"]["projected_daily_use"]


def test_shadow_groups_repeated_events_in_a_time_window() -> None:
    result = analyze_events(load_demo_data(), 24)
    assert len(result["findings"]) == 1
    finding = result["findings"][0]
    assert finding["event_count"] == 2
    assert finding["time_window"]["hours"] == 24


def test_shadow_review_and_confirmed_follow_up_case() -> None:
    client = TestClient(app)
    finding = client.get("/api/shadow/findings").json()["findings"][0]
    assert client.put(f"/api/shadow/findings/{finding['id']}/review", json={"status": "Review policy", "note": "Demo review"}).status_code == 200
    created = client.post(f"/api/shadow/findings/{finding['id']}/create-test-case", json={"confirmed": True})
    assert created.status_code == 200
    assert any(case["test_case"]["id"] == created.json()["id"] for case in client.get("/api/simulator/cases").json())
