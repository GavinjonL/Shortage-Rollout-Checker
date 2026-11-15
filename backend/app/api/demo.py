"""Fixture endpoints for the fictional, in-memory demo scenario."""

import csv
import json
from io import StringIO
from typing import Any, Literal
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, ValidationError

from app.data.seed_demo import load_demo_data, replace_demo_table, reset_demo_data
from app.schemas.demo import DemoDataset
from app.schemas.finding import Finding
from app.schemas.medication import AlternativeLink, Department, Inventory, Medication, ShadowEvent, SystemConfig
from app.schemas.scenario import TestCase

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("/policy-samples")
def policy_samples() -> dict:
    """Source text and baseline expectations only; never supplies generated review results."""
    source = Path(__file__).resolve().parents[1] / "data" / "fixtures" / "policy_samples.json"
    return {"samples": json.loads(source.read_text(encoding="utf-8"))}


@router.get("", response_model=DemoDataset)
def get_demo_data() -> DemoDataset:
    return load_demo_data()


@router.post("/reset", response_model=DemoDataset)
def reset_demo() -> DemoDataset:
    """Restore the active fictional demo data from committed local fixtures."""
    from app.services.policy_store import replace_confirmed_rules
    from app.services.generated_cases import clear_generated_cases
    replace_confirmed_rules([])
    clear_generated_cases()
    return reset_demo_data()


class DemoImportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    format: Literal["csv", "json"]
    content: str


class RowValidationError(BaseModel):
    row: int
    field: str
    message: str


class DemoImportResponse(BaseModel):
    imported_rows: int
    errors: list[RowValidationError]
    dataset: DemoDataset | None = None


TABLE_MODELS = {
    "medications": Medication,
    "departments": Department,
    "configurations": SystemConfig,
    "test_cases": TestCase,
    "inventory": Inventory,
    "alternatives": AlternativeLink,
    "events": ShadowEvent,
    "findings": Finding,
}


def _parse_rows(request: DemoImportRequest) -> list[dict[str, Any]]:
    try:
        if request.format == "json":
            rows = json.loads(request.content)
            if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
                raise ValueError("JSON must be an array of row objects.")
            return rows
        return list(csv.DictReader(StringIO(request.content)))
    except (csv.Error, json.JSONDecodeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/import/{table}", response_model=DemoImportResponse)
def import_demo_table(table: str, request: DemoImportRequest) -> DemoImportResponse:
    """Validate and replace a selected fictional table; rejects the whole file on row errors."""
    model = TABLE_MODELS.get(table)
    if model is None:
        raise HTTPException(status_code=404, detail=f"Unsupported demo table: {table}")
    rows = _parse_rows(request)
    validated_rows: list[dict[str, Any]] = []
    errors: list[RowValidationError] = []
    for index, row in enumerate(rows, start=1):
        try:
            validated_rows.append(model.model_validate(row).model_dump())
        except ValidationError as error:
            for item in error.errors():
                errors.append(RowValidationError(
                    row=index,
                    field=".".join(str(part) for part in item["loc"]),
                    message=item["msg"],
                ))
    if errors:
        return DemoImportResponse(imported_rows=0, errors=errors)
    return DemoImportResponse(
        imported_rows=len(validated_rows),
        errors=[],
        dataset=replace_demo_table(table, validated_rows),
    )
