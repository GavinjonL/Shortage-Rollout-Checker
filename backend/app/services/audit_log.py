"""Privacy-safe, in-memory model-call metadata for the fictional demo."""
from time import monotonic
from datetime import datetime, timezone

_entries: list[dict] = []

def begin_call(purpose: str) -> float:
    return monotonic()

def finish_call(purpose: str, started: float, status: str, **metadata) -> None:
    _entries.append({"completed_at": datetime.now(timezone.utc).isoformat(), "purpose": purpose, "duration_ms": round((monotonic() - started) * 1000), "status": status, **metadata})

def model_call_log() -> list[dict]:
    return list(_entries)
