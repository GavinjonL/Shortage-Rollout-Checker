import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.policies import router as policies_router
from app.api.rollout import router as rollout_router
from app.api.simulator import router as simulator_router
from app.api.ripple import router as ripple_router
from app.api.shadow import router as shadow_router
from app.api.demo import router as demo_router

app = FastAPI(title="Shortage Rollout Checker", version="0.1.0")
allowed_origins = [origin.strip() for origin in os.getenv(
    "FRONTEND_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173"
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
app.include_router(demo_router)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "fictional-demo"}
