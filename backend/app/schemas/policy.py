from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

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


class PolicyExtractionRequest(BaseModel):
    """Fictional policy text sent for draft-only AI extraction."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    policy_text: str = Field(min_length=1, max_length=40_000)
    policy_id: str = Field(default="policy-draft", min_length=1, max_length=100)


class DraftPolicyRule(BaseModel):
    """An unconfirmed extraction. Nullable fields mean the policy did not say."""

    model_config = ConfigDict(extra="forbid")

    medication_id: str | None
    department_id: str | None
    condition: str | None
    restriction: str | None
    approved_alternative_id: str | None
    effective_date: str | None
    source_excerpt: str = Field(min_length=1)
    confirmed_by_user: Literal[False] = False


class PolicyDraft(BaseModel):
    """Reviewable AI output; it cannot activate a downstream workflow."""

    model_config = ConfigDict(extra="forbid")

    policy_id: str
    rules: list[DraftPolicyRule]
    ambiguities: list[str]
    is_draft: Literal[True] = True


class ConfirmedPolicyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rules: list[PolicyRule] = Field(default_factory=list)


class PolicyRuleReviewRequest(BaseModel):
    """Persist a pharmacist's draft, confirmed, or rejected rule review."""
    model_config = ConfigDict(extra="forbid")
    rule_id: str
    policy_id: str
    status: Literal["Draft", "Confirmed", "Rejected"]
    title: str | None = None
    medication_id: str | None = None
    department_id: str | None = None
    condition: str | None = None
    restriction: str | None = None
    approved_alternative_id: str | None = None
    effective_date: str | None = None
    source_excerpt: str = Field(min_length=1)
