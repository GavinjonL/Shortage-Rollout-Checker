"""Manual Groq smoke test. Run only after configuring backend/.env or repo-root .env."""

from app.ai.client import get_policy_extractor


if __name__ == "__main__":
    extractor = get_policy_extractor()
    draft = extractor.extract(
        "Fictional policy: MED-A is restricted to DEPT-ER effective 2026-11-15. "
        "MED-B is the approved alternative for MED-A.",
        "smoke-policy-001",
    )
    print(draft.model_dump_json(indent=2))
