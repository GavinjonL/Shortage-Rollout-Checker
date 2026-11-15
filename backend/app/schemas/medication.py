from pydantic import BaseModel, ConfigDict, Field


class Medication(BaseModel):
    """A fictional medication record used only by the prototype."""

    model_config = ConfigDict(extra="forbid")
    id: str
    name: str
    form: str


class Department(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    name: str


class SystemConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    system_type: str
    department_id: str
    medication_id: str
    enabled: bool
    instruction_text: str
    source_record_id: str

class Inventory(BaseModel):
    model_config = ConfigDict(extra="forbid")
    medication_id: str
    location_id: str
    quantity_on_hand: float = Field(ge=0)
    average_daily_use: float = Field(ge=0)
    minimum_reserve: float = Field(ge=0)


class AlternativeLink(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source_medication_id: str
    alternative_medication_id: str
    approved_condition: str
    approved_by_role: str


class ShadowEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    timestamp: str
    department_id: str
    medication_id: str
    event_type: str
    result: str
    source_record_id: str
