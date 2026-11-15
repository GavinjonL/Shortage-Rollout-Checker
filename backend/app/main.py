import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.policies import router as policies_router

app = FastAPI(title="Shortage Rollout Checker", version="0.1.0")
allowed_origins = [origin.strip() for origin in os.getenv(
    "FRONTEND_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173"
).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
app.include_router(policies_router)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "fictional-demo"}
