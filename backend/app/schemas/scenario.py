from pydantic import BaseModel, ConfigDict

class TestCase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    policy_id: str
    department_id: str
    medication_id: str
    scenario_text: str
    expected_outcome: str
    source_rule_id: str
