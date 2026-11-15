"""Traceable, limited text checks over confirmed rules and mock records."""
import hashlib
import json
import re
from datetime import datetime, timezone

from app.data.seed_demo import load_demo_data
from app.schemas.policy import PolicyRule


def _normal(value: str) -> str:
    return value.strip().casefold()


def _restriction(value: str) -> bool:
    text = _normal(value)
    return bool(re.search(r"\brestrict(?:ed|ion|ions)?\b", text)) and not bool(
        re.search(r"\b(?:no|not)\s+(?:use\s+)?restrict(?:ed|ion|ions)?\b", text)
    )


def review_rollout(rules: list[PolicyRule]) -> dict:
    """Report every rule and matched record; never imply unassessed records passed."""
    configurations = [c.model_dump() for c in load_demo_data().configurations]
    findings = []
    reviews = []
    for rule in rules:
        review = {"rule": rule.model_dump(), "records": [], "outcome": "Not evaluated", "reason": ""}
        reviews.append(review)
        if not rule.confirmed_by_user:
            review["reason"] = "This rule is not confirmed."
            continue
        if not _restriction(rule.restriction):
            review["reason"] = "This limited checker supports affirmative restriction wording only. A reviewer must assess this rule."
            continue
        matches = [c for c in configurations if _normal(c["medication_id"]) == _normal(rule.medication_id)
                   and _normal(c["department_id"]) == _normal(rule.department_id)]
        if not matches:
            review.update(outcome="No matching records", reason="No supplied configuration matches both this medication and department. Implementation has not been verified.")
            continue
        for config in matches:
            instruction = _normal(config["instruction_text"])
            stale = config["enabled"] and any(phrase in instruction for phrase in ("routine use", "available"))
            if stale:
                outcome = "Possible mismatch"
                reason = "The confirmed rule restricts use, but this enabled record still says routine use or available."
            elif config["enabled"] and _restriction(instruction):
                outcome = "Restriction wording present"
                reason = "The instruction contains restriction wording. Conditions, dates, and alternatives still require manual review."
            else:
                outcome = "Needs clarification"
                reason = "The record is disabled or lacks explicit restriction wording. This checker cannot establish whether it implements the rule."
            review["records"].append({"configuration_id": config["id"], "source_record_id": config["source_record_id"],
                                      "system_type": config["system_type"], "instruction_text": config["instruction_text"],
                                      "outcome": outcome, "reason": reason})
            if not stale:
                continue
            findings.append({
                "id": f"ROL-{rule.id}-{config['id']}", "feature": "Rollout Review", "severity": "High",
                "summary": f"{config['system_type'].upper()} configuration may not reflect confirmed restriction for {rule.medication_id}.",
                "evidence_ids": [rule.id, config["source_record_id"]],
                "assumptions": ["Fictional configuration record", "Confirmed policy rule", "Limited instruction text comparison"],
                "review_status": "Needs review", "created_at": datetime.now(timezone.utc).isoformat(),
                "policy_rule_id": rule.id, "source_record_id": config["source_record_id"],
                "department_id": config["department_id"], "system_type": config["system_type"],
                "instruction_text": config["instruction_text"], "source_excerpt": rule.source_excerpt,
                "restriction": rule.restriction, "condition": rule.condition, "reason": reason,
            })
        outcomes = {record["outcome"] for record in review["records"]}
        review["outcome"] = "Possible mismatch" if "Possible mismatch" in outcomes else "Needs clarification" if "Needs clarification" in outcomes else "Restriction wording present"
        review["reason"] = "Every matching record is listed below. These text checks do not evaluate the full policy meaning."
    policy_json = json.dumps([r.model_dump() for r in rules], sort_keys=True)
    return {"findings": findings, "rule_reviews": reviews, "confirmed_rule_count": sum(r.confirmed_by_user for r in rules),
            "policy_fingerprint": hashlib.sha256(policy_json.encode()).hexdigest(), "configurations": configurations,
            "coverage_notes": ["Uses confirmed rules and supplied mock records. Limited text checks only; conditions, dates, and alternatives need manual review. No AI call is made by this comparison."]}


def check_rollout(rules: list[PolicyRule]) -> list[dict]:
    return review_rollout(rules)["findings"]
