"""Load and validate the fictional, read-only Sprint 1 demo fixtures."""

import json
from pathlib import Path
from typing import Any

from app.schemas.demo import DemoDataset

FIXTURES_DIRECTORY = Path(__file__).parent / "fixtures"


def _read_fixture(name: str) -> Any:
    """Read a local JSON fixture; no network or hospital connection is used."""
    with (FIXTURES_DIRECTORY / name).open(encoding="utf-8") as fixture:
        return json.load(fixture)


def load_demo_data() -> DemoDataset:
    """Return a fresh validated dataset so callers cannot mutate shared state."""
    return DemoDataset.model_validate({
        "policy": _read_fixture("policy.json"),
        "medications": _read_fixture("medications.json"),
        "departments": _read_fixture("departments.json"),
        "configurations": _read_fixture("configurations.json"),
        "test_cases": _read_fixture("test_cases.json"),
        "inventory": _read_fixture("inventory.json"),
        "alternatives": _read_fixture("alternatives.json"),
        "events": _read_fixture("events.json"),
        "findings": _read_fixture("findings.json"),
    })
