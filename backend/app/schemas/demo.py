"""Schemas for a complete, fictional Sprint 1 demo dataset."""

from pydantic import BaseModel, ConfigDict

from app.schemas.finding import Finding
from app.schemas.medication import AlternativeLink, Department, Inventory, Medication, ShadowEvent, SystemConfig
from app.schemas.policy import PolicyRule
from app.schemas.scenario import TestCase


class DemoPolicy(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    name: str
    rules: list[PolicyRule]


class DemoDataset(BaseModel):
    """All data is fictional and suitable only for the browser demo."""

    model_config = ConfigDict(extra="forbid")
    policy: DemoPolicy
    medications: list[Medication]
    departments: list[Department]
    configurations: list[SystemConfig]
    test_cases: list[TestCase]
    inventory: list[Inventory]
    alternatives: list[AlternativeLink]
    events: list[ShadowEvent]
    findings: list[Finding]
