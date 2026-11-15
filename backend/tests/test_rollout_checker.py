from app.schemas.policy import PolicyRule
from app.services.rollout_checker import check_rollout


def test_confirmed_restriction_flags_stale_matching_configuration():
    rule = PolicyRule(
        id="rule-1", policy_id="p", medication_id="MED-A", department_id="DEPT-GENERAL-WARD",
        condition="During shortage", restriction="Restrict use", approved_alternative_id="MED-B",
        effective_date="2026-11-15", source_excerpt="Fictional source", confirmed_by_user=True,
    )
    findings = check_rollout([rule])
    assert len(findings) == 1
    assert findings[0]["evidence_ids"] == ["rule-1", "ehr-demo-001"]


def test_unconfirmed_rule_does_not_generate_finding():
    rule = PolicyRule(
        id="rule-1", policy_id="p", medication_id="MED-A", department_id="DEPT-GENERAL-WARD",
        condition="During shortage", restriction="Restrict use", approved_alternative_id=None,
        effective_date="2026-11-15", source_excerpt="Fictional source", confirmed_by_user=False,
    )
    assert check_rollout([rule]) == []
