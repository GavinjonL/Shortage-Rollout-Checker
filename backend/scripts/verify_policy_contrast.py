"""Two live extractions, isolated from the running review session."""
import json
from pathlib import Path
from app.ai.client import AISettings, get_policy_extractor
from app.schemas.policy import PolicyRule
from app.services.rollout_checker import review_rollout
from app.services.audit_log import model_call_log
from app.data.seed_demo import load_demo_data
from app.services.flight_simulator import confirmed_simulation_cases, evaluate_test_case
from app.services.ripple_engine import build_projection
from app.services.shadow_analyzer import analyze_events

root = Path(__file__).resolve().parents[2]
if AISettings.from_environment().provider == "mock":
    raise SystemExit("Requires a live provider, not mock mode.")
extractor = get_policy_extractor()
results = []
for label, filename, medication in [("A", "sample-policy-contrast-a.txt", "med-a-iv"), ("B", "sample-policy-contrast-b.txt", "med-c-reserve")]:
    text = (root / "docs" / filename).read_text()
    draft = extractor.extract(text, f"contrast-{label}")
    assert len(draft.rules) == 1, draft
    extracted = draft.rules[0]
    assert extracted.medication_id == medication, draft
    rule = PolicyRule(**{**extracted.model_dump(), "id": f"contrast-{label}-rule", "policy_id": draft.policy_id,
                         "condition": extracted.condition or "Not specified by extraction; manual review required.", "confirmed_by_user": True})
    report = review_rollout([rule])
    data = load_demo_data()
    data.policy.rules = [rule]
    simulator = [evaluate_test_case(case.test_case, r, case.configuration).status for case, r in confirmed_simulation_cases([rule])]
    ripple = build_projection(data, 30)["primary"]
    shadow_count = len(analyze_events(data)["findings"])
    results.append({"simulator_statuses": simulator, "ripple": ripple, "shadow_finding_count": shadow_count,"sample": label, "draft": draft.model_dump(), "findings": report["findings"],
                    "rule_reviews": report["rule_reviews"], "policy_fingerprint": report["policy_fingerprint"],
                    "provider_call": model_call_log()[-1]})
assert len(results[0]["findings"]) == 1
assert results[0]["findings"][0]["source_record_id"] == "ehr-demo-001"
assert results[1]["findings"] == []
assert results[1]["rule_reviews"][0]["outcome"] == "Needs clarification"
assert results[1]["rule_reviews"][0]["records"][0]["source_record_id"] == "pump-demo-001"
assert results[0]["simulator_statuses"] == ["Pass", "Possible mismatch", "Needs clarification"]
assert results[1]["simulator_statuses"] == []
assert results[0]["ripple"]["projection"]["projected_daily_use"] == 13
assert results[1]["ripple"]["projection"] is None
assert results[0]["shadow_finding_count"] == 1
assert results[1]["shadow_finding_count"] == 0
(root / "docs" / "policy-contrast-results.json").write_text(json.dumps(results, indent=2))
for result in results:
    print(json.dumps({"sample": result["sample"], "medication": result["rule_reviews"][0]["rule"]["medication_id"],
                      "findings": len(result["findings"]), "simulator_statuses": result["simulator_statuses"],
                      "ripple": result["ripple"], "shadow_finding_count": result["shadow_finding_count"], "outcome": result["rule_reviews"][0]["outcome"],
                      "records": [r["source_record_id"] for r in result["rule_reviews"][0]["records"]],
                      "provider_response_id": result["provider_call"]["provider_response_id"]}))
print("PASS: two different live policy inputs produce different record comparisons. Running server state unchanged.")
