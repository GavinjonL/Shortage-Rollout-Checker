"""Strict allowlist for read-only fictional-demo function tools."""
from app.services.flight_simulator import run_sample_cases, confirmed_simulation_cases
from app.services.policy_store import get_confirmed_rules
from app.services.ripple_engine import build_projection
from app.services.shadow_analyzer import analyze_events
from app.services.policy_store import confirmed_dataset as load_demo_data

READ_ONLY_TOOLS = (
    "get_confirmed_policy", "get_mock_configuration", "get_sample_orders",
    "run_policy_simulation", "get_inventory_snapshot", "build_ripple_projection",
    "get_shadow_events",
)


def _schema(name: str, properties: dict | None = None) -> dict:
    return {"type": "function", "function": {"name": name, "description": "Read fictional demo data only.", "parameters": {"type": "object", "additionalProperties": False, "properties": properties or {}, "required": []}}}


TOOL_SCHEMAS = [
    _schema("get_confirmed_policy"), _schema("get_mock_configuration"), _schema("get_sample_orders"),
    _schema("run_policy_simulation"), _schema("get_inventory_snapshot"), _schema("build_ripple_projection"),
    _schema("get_shadow_events"),
]


def dispatch_read_only_tool(name: str, arguments: dict) -> dict:
    if name not in READ_ONLY_TOOLS or arguments:
        raise ValueError("Unknown, write-capable, or invalid read-only tool request.")
    rules = get_confirmed_rules()
    if name == "get_confirmed_policy": return {"rules": [rule.model_dump() for rule in rules]}
    if name == "get_mock_configuration": return {"configurations": [c.model_dump() for c in load_demo_data().configurations]}
    if name == "get_sample_orders": return {"test_cases": [case.test_case.model_dump() for case, _ in confirmed_simulation_cases(rules)]}
    if name == "run_policy_simulation": return {"cases": run_sample_cases(rules)}
    if name == "get_inventory_snapshot": return {"inventory": [i.model_dump() for i in load_demo_data().inventory]}
    if name == "build_ripple_projection": return build_projection(load_demo_data())
    return analyze_events(load_demo_data())
