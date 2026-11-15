from pydantic import BaseModel, ConfigDict

class Finding(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    feature: str
    severity: str
    summary: str
    evidence_ids: list[str]
    assumptions: list[str]
    review_status: str
    created_at: str
