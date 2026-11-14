from pydantic import BaseModel

class PolicyRule(BaseModel):
    id: str
    policy_id: str
    medication_id: str
    department_id: str
    condition: str
    restriction: str
    approved_alternative_id: str | None = None
    effective_date: str
    source_excerpt: str
    confirmed_by_user: bool = False
