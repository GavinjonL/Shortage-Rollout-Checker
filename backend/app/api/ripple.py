"""Ripple projection endpoints."""
from fastapi import APIRouter, Query
from app.services.policy_store import get_confirmed_rules
from app.services.ripple_engine import build_projection

router = APIRouter(prefix="/api/ripple", tags=["ripple"])

@router.get("/projection")
def ripple_projection(shift_percent: float = Query(default=30, ge=0, le=100)) -> dict:
    return build_projection(get_confirmed_rules(), shift_percent)
