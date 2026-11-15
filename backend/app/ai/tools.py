"""Strict allowlist for read-only fictional-demo tools."""
from app.services.policy_store import get_confirmed_rules
from app.services.flight_simulator import run_sample_cases
from app.services.ripple_engine import build_projection
from app.services.shadow_analyzer import analyze_events

READ_ONLY_TOOLS = ("get_confirmed_policy", "run_policy_simulation", "build_ripple_projection", "get_shadow_events")

TOOL_SCHEMAS = [{"type": "function", "function": {"name": name, "description": "Read fictional demo data only.", "parameters": {"type": "object", "additionalProperties": False, "properties": {}, "required": []}}} for name in READ_ONLY_TOOLS]

def dispatch_read_only_tool(name: str, arguments: dict) -> dict:
    if name not in READ_ONLY_TOOLS or arguments:
        raise ValueError("Unknown, write-capable, or invalid read-only tool request.")
    rules = get_confirmed_rules()
    if name == "get_confirmed_policy": return {"rules": [rule.model_dump() for rule in rules]}
    if name == "run_policy_simulation": return {"cases": run_sample_cases(rules)}
    if name == "build_ripple_projection": return build_projection(rules)
    return analyze_events(rules)
