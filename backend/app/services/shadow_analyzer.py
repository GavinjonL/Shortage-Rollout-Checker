"""Group fictional read-only events into review findings."""
import json
from collections import Counter
from pathlib import Path
from app.schemas.policy import PolicyRule

_FIXTURE = Path(__file__).parent.parent / "data" / "fixtures" / "events.json"

def analyze_events(rules: list[PolicyRule]) -> dict:
    events = json.loads(_FIXTURE.read_text(encoding="utf-8"))
    if not rules:
        return {"events": events, "findings": []}
    rule = rules[0]
    matching = [e for e in events if e["medication_id"].casefold() == rule.medication_id.casefold() and e["result"] == "allowed"]
    groups = Counter((e["department_id"], e["event_type"]) for e in matching)
    findings = [{"id": f"SHD-{dept}-{event_type}", "feature": "Shadow Mode", "review_status": "Needs review",
        "summary": f"{count} repeated fictional {event_type} events may not match the confirmed restriction.",
        "policy_rule_id": rule.id, "department_id": dept, "event_type": event_type,
        "evidence_ids": [rule.id, *[e["id"] for e in matching if e["department_id"] == dept and e["event_type"] == event_type]]}
        for (dept, event_type), count in groups.items() if count >= 2]
    return {"events": events, "findings": findings, "read_only": True}
