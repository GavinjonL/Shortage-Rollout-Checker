from fastapi import APIRouter, Query
from app.data.seed_demo import load_demo_data
from app.services.ripple_engine import build_projection
router = APIRouter(prefix="/api/ripple", tags=["ripple"])
@router.get("/projection")
def ripple_projection(shift_percent: float = Query(30, ge=0, le=100), comparison_shift_percent: float | None = Query(None, ge=0, le=100)) -> dict:
    return build_projection(load_demo_data(), shift_percent, comparison_shift_percent)
