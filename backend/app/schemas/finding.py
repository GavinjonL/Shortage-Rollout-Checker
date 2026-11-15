from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

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

class FindingReviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["Expected", "Dismissed", "Review policy"]
    note: str = Field(default="", max_length=2_000)

class CreateTestCaseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    confirmed: Literal[True]
