from fastapi import APIRouter, HTTPException, Query
from app.data.seed_demo import load_demo_data
from app.schemas.finding import CreateTestCaseRequest, FindingReviewRequest
from app.schemas.scenario import TestCase
from app.services.generated_cases import add_generated_case
from app.services.shadow_analyzer import analyze_events
router = APIRouter(prefix="/api/shadow", tags=["shadow"])
_reviews: dict[str, dict[str, str]] = {}
def _analysis(hours: int) -> dict:
    result = analyze_events(load_demo_data(), hours)
    for finding in result["findings"]: finding.update(_reviews.get(finding["id"], {}))
    return result
@router.get("/findings")
def shadow_findings(window_hours: int = Query(24, ge=1, le=168)) -> dict: return _analysis(window_hours)
@router.put("/findings/{finding_id}/review")
def review_finding(finding_id: str, request: FindingReviewRequest) -> dict:
    if not any(f["id"] == finding_id for f in _analysis(24)["findings"]): raise HTTPException(404, "Fictional Shadow Mode finding not found.")
    _reviews[finding_id] = {"review_status": request.status, "review_note": request.note}
    return {"id": finding_id, **_reviews[finding_id]}
@router.post("/findings/{finding_id}/create-test-case", response_model=TestCase)
def create_test_case(finding_id: str, request: CreateTestCaseRequest) -> TestCase:
    finding = next((f for f in _analysis(24)["findings"] if f["id"] == finding_id), None)
    if not finding: raise HTTPException(404, "Fictional Shadow Mode finding not found.")
    data = load_demo_data(); rule = next(r for r in data.policy.rules if r.id == finding["policy_rule_id"]); config = next((c for c in data.configurations if c.department_id == rule.department_id and c.medication_id == rule.medication_id), None)
    return add_generated_case(TestCase(id=f"shadow-case-{finding_id}", policy_id=rule.policy_id, department_id=rule.department_id, medication_id=rule.medication_id, title="Confirmed Shadow Mode follow-up", configuration_id=config.id if config else None, shortage_active=True, oral_administration_eligible=None, source_rule_id=rule.id, scenario_text=f"User-confirmed follow-up created from {finding_id}.", expected_outcome="Review the repeated fictional pattern against the confirmed policy rule."))
