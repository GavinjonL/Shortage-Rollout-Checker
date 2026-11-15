from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.medication import SystemConfig

class TestCase(BaseModel):
    """A fictional, deterministic simulator input."""

    model_config = ConfigDict(extra="forbid")
    id: str
    policy_id: str
    department_id: str
    medication_id: str
    scenario_text: str
    expected_outcome: str
    source_rule_id: str
    title: str = Field(min_length=1)
    configuration_id: str | None = None
    shortage_active: bool | None
    oral_administration_eligible: bool | None


class ConfigurationOverride(BaseModel):
    """An in-memory demo-only configuration edit used for reruns."""

    model_config = ConfigDict(extra="forbid")
    enabled: bool | None = None
    instruction_text: str | None = Field(default=None, min_length=1)


class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    configuration_override: ConfigurationOverride | None = None


class SimulationResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    case_id: str
    status: Literal["Pass", "Possible mismatch", "Needs clarification"]
    expected_outcome: str
    observed_behavior: str
    rule_id: str
    configuration_id: str | None
    evidence_ids: list[str]
    assumptions: list[str]
    reason: str


class SimulationCaseDetail(BaseModel):
    model_config = ConfigDict(extra="forbid")
    test_case: TestCase
    configuration: SystemConfig | None
