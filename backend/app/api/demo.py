"""Read-only fixture endpoint for loading the fictional demo scenario."""

from fastapi import APIRouter

from app.data.seed_demo import load_demo_data
from app.schemas.demo import DemoDataset

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("", response_model=DemoDataset)
def get_demo_data() -> DemoDataset:
    return load_demo_data()
