"""Read-only Shadow Mode endpoints."""
from fastapi import APIRouter
from app.services.policy_store import get_confirmed_rules
from app.services.shadow_analyzer import analyze_events

router = APIRouter(prefix="/api/shadow", tags=["shadow"])

@router.get("/findings")
def shadow_findings() -> dict:
    return analyze_events(get_confirmed_rules())
