"""Run deterministic, review-only checks against fictional sample orders."""

from app.schemas.medication import SystemConfig
from app.schemas.policy import PolicyRule
from app.schemas.scenario import ConfigurationOverride, SimulationResult, TestCase


def run_sample_cases(rules: list[PolicyRule]) -> list[dict]:
    """Return concise deterministic cases for existing confirmed-policy callers."""
    if not rules:
        return []
    rule = rules[0]
    return [
        {"id": "TC-001", "status": "Pass", "policy_rule_id": rule.id, "department_id": rule.department_id,
         "scenario_text": "Fictional order includes the confirmed shortage condition.", "expected_behavior": rule.restriction,
         "observed_behavior": "Mock order set displays the confirmed restriction.", "evidence_ids": [rule.id, "order-demo-001", "ehr-demo-001"]},
        {"id": "TC-002", "status": "Possible mismatch", "policy_rule_id": rule.id, "department_id": rule.department_id,
         "scenario_text": "Fictional order includes the confirmed shortage condition.", "expected_behavior": rule.restriction,
         "observed_behavior": "Mock EHR record allows routine use.", "evidence_ids": [rule.id, "order-demo-002", "ehr-demo-001"]},
        {"id": "TC-003", "status": "Needs clarification", "policy_rule_id": rule.id, "department_id": rule.department_id,
         "scenario_text": "Fictional order omits the shortage-condition input.", "expected_behavior": "Do not infer policy applicability.",
         "observed_behavior": "Required condition is missing from supplied data.", "evidence_ids": [rule.id, "order-demo-003"]},
    ]


def evaluate_test_case(test_case: TestCase, rule: PolicyRule, configuration: SystemConfig | None, configuration_override: ConfigurationOverride | None = None) -> SimulationResult:
    """Compare supplied fields without recommending medication or inferring data."""
    evidence_ids = [test_case.id, rule.id]
    assumptions = ["Fictional sample order", "Simulation only — based on supplied sample data"]
    if configuration is not None:
        evidence_ids.append(configuration.source_record_id)
    if test_case.shortage_active is None:
        return SimulationResult(case_id=test_case.id, status="Needs clarification", expected_outcome=test_case.expected_outcome, observed_behavior="The supplied sample case does not state whether the fictional shortage flag is active.", rule_id=rule.id, configuration_id=test_case.configuration_id, evidence_ids=evidence_ids, assumptions=assumptions, reason="The application does not infer a missing shortage condition.")
    if configuration is None:
        return SimulationResult(case_id=test_case.id, status="Needs clarification", expected_outcome=test_case.expected_outcome, observed_behavior="No supplied mock configuration is linked to this sample case.", rule_id=rule.id, configuration_id=None, evidence_ids=evidence_ids, assumptions=assumptions, reason="A configuration record is required to compare observed behavior.")
    enabled = configuration_override.enabled if configuration_override and configuration_override.enabled is not None else configuration.enabled
    instruction = configuration_override.instruction_text if configuration_override and configuration_override.instruction_text is not None else configuration.instruction_text
    normalized_instruction = instruction.casefold()
    evidence_ids.append(configuration.id)
    if not test_case.shortage_active:
        return SimulationResult(case_id=test_case.id, status="Pass", expected_outcome=test_case.expected_outcome, observed_behavior="The supplied shortage flag is inactive; the restriction is not evaluated for this sample.", rule_id=rule.id, configuration_id=configuration.id, evidence_ids=evidence_ids, assumptions=assumptions, reason="The confirmed rule applies only while the supplied shortage flag is active.")
    has_current_guidance = "restricted" in normalized_instruction and ("shortage guidance" in normalized_instruction or "approved alternative" in normalized_instruction)
    contraindication_is_addressed = "contraindication" in normalized_instruction
    matches = enabled and has_current_guidance and (test_case.oral_administration_eligible is not False or contraindication_is_addressed)
    if matches:
        return SimulationResult(case_id=test_case.id, status="Pass", expected_outcome=test_case.expected_outcome, observed_behavior=f"Mock configuration {configuration.source_record_id} contains active restriction and shortage guidance.", rule_id=rule.id, configuration_id=configuration.id, evidence_ids=evidence_ids, assumptions=assumptions, reason="The supplied configuration contains the rule's required shortage guidance.")
    missing_conditions: list[str] = []
    if not enabled:
        missing_conditions.append("the configuration is disabled")
    if not has_current_guidance:
        missing_conditions.append("the instruction does not contain current restriction and shortage guidance")
    if test_case.oral_administration_eligible is False and not contraindication_is_addressed:
        missing_conditions.append("the instruction does not address the supplied contraindication")
    return SimulationResult(case_id=test_case.id, status="Possible mismatch", expected_outcome=test_case.expected_outcome, observed_behavior=f"Mock configuration {configuration.source_record_id}: {instruction}", rule_id=rule.id, configuration_id=configuration.id, evidence_ids=evidence_ids, assumptions=assumptions, reason="Possible mismatch — " + "; ".join(missing_conditions) + ".")
