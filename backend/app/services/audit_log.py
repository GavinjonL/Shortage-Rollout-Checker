"""Privacy-safe, in-memory model-call metadata for the fictional demo."""
from time import monotonic

_entries: list[dict] = []

def begin_call(purpose: str) -> float:
    return monotonic()

def finish_call(purpose: str, started: float, status: str) -> None:
    _entries.append({"purpose": purpose, "duration_ms": round((monotonic() - started) * 1000), "status": status})

def model_call_log() -> list[dict]:
    return list(_entries)
