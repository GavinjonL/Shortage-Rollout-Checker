"""Strict allowlist for read-only fictional-demo function tools."""
import json
from pathlib import Path

from app.services.flight_simulator import run_sample_cases
from app.services.policy_store import get_confirmed_rules
from app.services.ripple_engine import build_projection
from app.services.shadow_analyzer import analyze_events
from app.data.seed_demo import load_demo_data

_FIXTURES = Path(__file__).parent.parent / "data" / "fixtures"
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


def _fixture(name: str) -> object:
    return json.loads((_FIXTURES / name).read_text(encoding="utf-8"))


def dispatch_read_only_tool(name: str, arguments: dict) -> dict:
    if name not in READ_ONLY_TOOLS or arguments:
        raise ValueError("Unknown, write-capable, or invalid read-only tool request.")
    rules = get_confirmed_rules()
    if name == "get_confirmed_policy": return {"rules": [rule.model_dump() for rule in rules]}
    if name == "get_mock_configuration": return {"configurations": _fixture("configurations.json")}
    if name == "get_sample_orders": return {"test_cases": _fixture("test_cases.json")}
    if name == "run_policy_simulation": return {"cases": run_sample_cases(rules)}
    if name == "get_inventory_snapshot": return {"inventory": _fixture("inventory.json")}
    if name == "build_ripple_projection": return build_projection(load_demo_data())
    return analyze_events(load_demo_data())
