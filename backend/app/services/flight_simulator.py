"""Run deterministic, review-only checks against fictional sample orders."""

from app.schemas.medication import SystemConfig
from app.schemas.policy import PolicyRule
from app.schemas.scenario import ConfigurationOverride, SimulationResult, TestCase


def run_sample_cases(rules: list[PolicyRule]) -> list[dict]:
    """Return concise deterministic cases for existing confirmed-policy callers."""
    return [evaluate_test_case(case.test_case, rule, case.configuration).model_dump()
            for case, rule in confirmed_simulation_cases(rules)]


def confirmed_simulation_cases(rules: list[PolicyRule]):
    from app.data.seed_demo import load_demo_data
    from app.schemas.scenario import SimulationCaseDetail
    from app.services.generated_cases import list_generated_cases
    data = load_demo_data()
    configurations = {c.id: c for c in data.configurations}
    results = []
    for rule in rules:
        if not rule.confirmed_by_user or "restrict" not in rule.restriction.casefold():
            continue
        for template in [*data.test_cases, *list_generated_cases()]:
            if template.medication_id != rule.medication_id or template.department_id != rule.department_id:
                continue
            case = template.model_copy(update={"id": template.id if template.source_rule_id == rule.id else f"{rule.id}--{template.id}", "source_rule_id": rule.id,
                                               "policy_id": rule.policy_id, "expected_outcome": rule.restriction})
            results.append((SimulationCaseDetail(test_case=case, configuration=configurations.get(case.configuration_id)), rule))
    return results


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
