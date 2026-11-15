import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.policies import router as policies_router
from app.api.rollout import router as rollout_router
from app.api.simulator import router as simulator_router
from app.api.ripple import router as ripple_router
from app.api.shadow import router as shadow_router
from app.api.ai import check_ai, router as ai_router
from app.api.demo import router as demo_router
from app.ai.client import AISettings

app = FastAPI(title="MedSync", version="0.1.0")
allowed_origins = [origin.strip() for origin in os.getenv(
    "FRONTEND_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5175,http://localhost:5175"
).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type"],
)
app.include_router(policies_router)
app.include_router(rollout_router)
app.include_router(simulator_router)
app.include_router(ripple_router)
app.include_router(shadow_router)
app.include_router(ai_router)
app.include_router(demo_router)
# Direct registration keeps this backend-only diagnostic visible in local Swagger.
app.post("/api/ai/check", tags=["ai"])(check_ai)

@app.on_event("startup")
def validate_live_ai_configuration() -> None:
    settings = AISettings.from_environment()
    if settings.provider != "mock" and not settings.api_key:
        key_name = "GROQ_API_KEY" if settings.provider == "groq" else "OPENAI_API_KEY"
        raise RuntimeError(f"Live AI mode requires {key_name}. Configure backend/.env or set AI_PROVIDER=mock.")

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "fictional-demo"}
