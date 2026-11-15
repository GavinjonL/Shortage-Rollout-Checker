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


def _fixture_dataset() -> DemoDataset:
    """Build the immutable, fictional baseline dataset from local fixtures."""
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


_demo_data = _fixture_dataset()


def load_demo_data() -> DemoDataset:
    """Return a fresh copy so callers cannot mutate the active demo state."""
    return _demo_data.model_copy(deep=True)


def reset_demo_data() -> DemoDataset:
    """Restore the active in-memory demo to its local fixture baseline."""
    global _demo_data
    _demo_data = _fixture_dataset()
    return load_demo_data()


def replace_demo_table(table: str, records: list[Any]) -> DemoDataset:
    """Replace one validated list table in the fictional in-memory demo dataset."""
    global _demo_data
    if table not in {
        "medications", "departments", "configurations", "test_cases", "inventory",
        "alternatives", "events", "findings",
    }:
        raise ValueError(f"Unsupported demo table: {table}")
    payload = _demo_data.model_dump()
    payload[table] = records
    _demo_data = DemoDataset.model_validate(payload)
    return load_demo_data()
