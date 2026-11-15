"""Read-only deterministic grouping for fictional Shadow Mode events."""
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from app.schemas.demo import DemoDataset

def analyze_events(dataset: DemoDataset, window_hours: int = 24) -> dict:
    rules = [r for r in dataset.policy.rules if r.confirmed_by_user and "restrict" in r.restriction.casefold()]
    groups = defaultdict(list); rule_by_id = {r.id: r for r in rules}
    for event in dataset.events:
        for rule in rules:
            if event.medication_id != rule.medication_id or event.department_id != rule.department_id or event.result != "allowed": continue
            stamp = datetime.fromisoformat(event.timestamp.replace("Z", "+00:00")).astimezone(timezone.utc)
            start = datetime.fromtimestamp(int(stamp.timestamp()) - int(stamp.timestamp()) % (window_hours * 3600), tz=timezone.utc)
            groups[(rule.id, event.department_id, event.event_type, start)].append(event)
    findings = []
    for (rule_id, department, event_type, start), events in groups.items():
        if len(events) < 2: continue
        rule = rule_by_id[rule_id]
        end = start + timedelta(hours=window_hours)
        findings.append({"id": f"shadow-{rule.id}-{department}-{event_type}-{start.strftime('%Y%m%d%H')}", "feature": "Shadow Mode", "severity": "medium", "review_status": "Needs review", "summary": f"Observed pattern — {len(events)} repeated fictional {event_type} events may differ from the confirmed restriction.", "policy_rule_id": rule.id, "department_id": department, "event_type": event_type, "event_count": len(events), "evidence_ids": [rule.id, *[e.id for e in events]], "source_excerpt": rule.source_excerpt, "time_window": {"start": start.isoformat(), "end": end.isoformat(), "hours": window_hours}, "reason": "Repeated allowed events matched the restricted medication, department, event type, and review window.", "assumptions": ["Fictional read-only event stream", "No order is changed or blocked"]})
    return {"events": [e.model_dump() for e in dataset.events], "findings": findings, "read_only": True, "window_hours": window_hours}
