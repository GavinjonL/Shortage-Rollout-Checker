"""Policy intake and confirmation endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.ai.client import PolicyExtractionError, PolicyExtractor, get_policy_extractor
from app.schemas.policy import ConfirmedPolicyRequest, PolicyDraft, PolicyExtractionRequest, PolicyRule
from app.services.policy_store import get_confirmed_rules, replace_confirmed_rules

router = APIRouter(prefix="/api/policies", tags=["policies"])


def policy_extractor_dependency() -> PolicyExtractor:
    """Convert startup/configuration problems into an API response, not a server crash."""
    try:
        return get_policy_extractor()
    except PolicyExtractionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/extract", response_model=PolicyDraft)
def extract_policy(
    request: PolicyExtractionRequest,
    extractor: Annotated[PolicyExtractor, Depends(policy_extractor_dependency)],
) -> PolicyDraft:
    """Create an unconfirmed, evidence-linked draft from fictional policy text."""
    try:
        return extractor.extract(request.policy_text, request.policy_id)
    except PolicyExtractionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.put("/confirmed", response_model=list[PolicyRule])
def confirm_policy(request: ConfirmedPolicyRequest) -> list[PolicyRule]:
    """Store pharmacist-confirmed fictional rules for this local demo session."""
    return replace_confirmed_rules(request.rules)


@router.get("/confirmed", response_model=list[PolicyRule])
def confirmed_policy() -> list[PolicyRule]:
    return get_confirmed_rules()
