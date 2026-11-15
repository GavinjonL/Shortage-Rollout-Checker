"""Run deterministic checks against fictional sample orders."""

from app.schemas.policy import PolicyRule


def run_sample_cases(rules: list[PolicyRule]) -> list[dict]:
    """Deterministic, review-only scenarios; no treatment decision is made."""
    if not rules:
        return []
    rule = rules[0]
    return [
        {"id": "TC-001", "status": "Pass", "policy_rule_id": rule.id, "department_id": rule.department_id,
         "scenario_text": "Fictional order includes the confirmed shortage condition.",
         "expected_behavior": rule.restriction, "observed_behavior": "Mock order set displays the confirmed restriction.",
         "evidence_ids": [rule.id, "order-demo-001", "ehr-demo-001"]},
        {"id": "TC-002", "status": "Possible mismatch", "policy_rule_id": rule.id, "department_id": rule.department_id,
         "scenario_text": "Fictional order includes the confirmed shortage condition.",
         "expected_behavior": rule.restriction, "observed_behavior": "Mock EHR record allows routine use.",
         "evidence_ids": [rule.id, "order-demo-002", "ehr-demo-001"]},
        {"id": "TC-003", "status": "Needs clarification", "policy_rule_id": rule.id, "department_id": rule.department_id,
         "scenario_text": "Fictional order omits the shortage-condition input.",
         "expected_behavior": "Do not infer policy applicability.", "observed_behavior": "Required condition is missing from supplied data.",
         "evidence_ids": [rule.id, "order-demo-003"]},
    ]
