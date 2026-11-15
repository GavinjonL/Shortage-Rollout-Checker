"""Deterministic comparison of confirmed fictional rules and mock configurations."""

import json
from pathlib import Path

from app.schemas.policy import PolicyRule

_FIXTURE = Path(__file__).parent.parent / "data" / "fixtures" / "configurations.json"


def _normal(value: str) -> str:
    return value.strip().casefold()


def check_rollout(rules: list[PolicyRule]) -> list[dict]:
    """Return possible implementation mismatches; never alter a configuration."""
    configurations = json.loads(_FIXTURE.read_text(encoding="utf-8"))
    findings: list[dict] = []
    for rule in rules:
        if not rule.confirmed_by_user or "restrict" not in rule.restriction.casefold():
            continue
        for config in configurations:
            matches_rule = (
                _normal(config["medication_id"]) == _normal(rule.medication_id)
                and _normal(config["department_id"]) == _normal(rule.department_id)
            )
            stale_instruction = config["enabled"] and any(
                phrase in config["instruction_text"].casefold()
                for phrase in ("routine use", "available")
            )
            if matches_rule and stale_instruction:
                findings.append({
                    "id": f"ROL-{config['id']}",
                    "feature": "Rollout Review",
                    "severity": "High",
                    "summary": f"{config['system_type'].upper()} configuration may not reflect confirmed restriction for {rule.medication_id}.",
                    "evidence_ids": [rule.id, config["source_record_id"]],
                    "assumptions": ["Fictional configuration record", "Confirmed policy rule"],
                    "review_status": "Needs review",
                    "created_at": "2026-11-14T10:00:00Z",
                    "policy_rule_id": rule.id,
                    "source_record_id": config["source_record_id"],
                    "department_id": config["department_id"],
                    "system_type": config["system_type"],
                    "instruction_text": config["instruction_text"],
                })
    return findings
