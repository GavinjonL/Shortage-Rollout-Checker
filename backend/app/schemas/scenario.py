from pydantic import BaseModel

class TestCase(BaseModel):
    id: str
    policy_id: str
    department_id: str
    medication_id: str
    scenario_text: str
    expected_outcome: str
    source_rule_id: str
