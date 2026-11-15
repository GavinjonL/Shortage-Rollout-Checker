"""Backend-only AI connection checks; responses never contain credentials."""
from fastapi import APIRouter, HTTPException
from app.ai.client import AISettings, PolicyExtractionError, get_policy_extractor

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/check")
def check_ai() -> dict:
    settings = AISettings.from_environment()
    if settings.provider == "mock":
        return {"ok": True, "provider": "mock", "mode": "offline"}
    try:
        # One minimal fictional request validates configuration without policy data.
        get_policy_extractor().extract("Fictional policy: MED-A is restricted.", "connection-check")
        return {"ok": True, "provider": settings.provider, "model": settings.model}
    except PolicyExtractionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.get("/status")
def ai_status() -> dict:
    from app.services.audit_log import model_call_log
    settings = AISettings.from_environment()
    return {"provider": settings.provider, "model": settings.model,
            "mode": "offline" if settings.provider == "mock" else "live",
            "key_configured": bool(settings.api_key), "calls": model_call_log()}
