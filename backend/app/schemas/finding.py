from pydantic import BaseModel

class Finding(BaseModel):
    id: str
    feature: str
    severity: str
    summary: str
    evidence_ids: list[str]
    assumptions: list[str]
    review_status: str
    created_at: str
