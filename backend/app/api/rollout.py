"""Read-only rollout review endpoints."""

from fastapi import APIRouter

from app.services.policy_store import get_confirmed_rules
from app.services.rollout_checker import check_rollout

router = APIRouter(prefix="/api/rollout", tags=["rollout"])


@router.get("/findings")
def rollout_findings() -> dict:
    """Compare only confirmed fictional rules with read-only mock configurations."""
    rules = get_confirmed_rules()
    return {"findings": check_rollout(rules), "confirmed_rule_count": len(rules)}
