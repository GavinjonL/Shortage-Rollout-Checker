# Shortage Rollout Checker

A fictional, review-only prototype for checking whether already-approved medication-shortage policies were implemented consistently. It does not provide treatment recommendations, use patient data, or modify hospital systems.

## Verify the live workflow

See [API and feature walkthrough](docs/api-verification.md) and [fresh sample policy](docs/sample-policy-api-test.txt) for exact inputs, expected contrasting results, and provider-call evidence. Rollout Review, Simulator, Ripple Map, and Shadow Mode use the current confirmed rules; their comparisons run in Python. Only policy extraction and an explicit AI connection check call the provider.

## AI policy extraction (Groq by default)

The backend turns fictional policy text into an **unconfirmed draft**. Every extracted rule includes the original supporting excerpt, and a pharmacist must review and confirm it before any deterministic rollout, simulation, inventory, or Shadow Mode workflow can use it.

### 1. Create a free Groq key

Create an account at [Groq Console](https://console.groq.com), then create an API key in its API Keys settings. Keep the key private: do not paste it into source code, browser JavaScript, screenshots, or chat.

### 2. Configure your local environment

Inside `backend/`, copy `.env.example` to a new file named `.env`. The new `backend/.env` is ignored by Git.

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

`AI_PROVIDER=mock` is an offline fallback. It returns an explicitly labeled synthetic draft for interface testing, with missing identifiers left blank so local UI/API development still works without credentials. To switch providers later, set `AI_PROVIDER=openai` and configure `OPENAI_API_KEY` and `OPENAI_MODEL`; application services do not need to change.

### 3. Install and start the backend

From `backend/`, create/activate a Python 3.11+ virtual environment, then install the project and test extras:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -e ".[test]"
uvicorn app.main:app --reload
```

For a reliable local server that releases its port when you press `Ctrl+C`, use the included launcher from `backend/` instead:

```powershell
.\scripts\run_backend.ps1
```

Use `-Reload` only while editing server code; it intentionally starts a supervisor and worker process.

The health check is at `http://localhost:8000/health`. The AI endpoint is `POST http://localhost:8000/api/policies/extract`; the key remains server-side.

### Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local Vite URL (normally `http://localhost:5173`) and select **Load demo data**. The browser requests `GET http://localhost:8000/api/demo`, which returns one validated, fully fictional scenario: two departments, three fictional medications, one approved alternative link, one possible configuration mismatch, and several read-only events. No live hospital system is contacted.

### Test the extraction endpoint

With the server running, use fictional text only:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/policies/extract -ContentType 'application/json' -Body '{"policy_id":"policy-demo-001","policy_text":"MED-A is restricted to DEPT-ER effective 2026-11-15. MED-B is the approved alternative for MED-A."}'
```

Run offline tests from `backend/` with `pytest`. They mock all provider calls, so they never consume API credits. A real one-request check is optional and manual: after configuring a valid Groq key, run `python scripts/smoke_groq.py` from `backend/`.

Groq currently documents support for strict JSON Schema output with `openai/gpt-oss-120b`; this project uses that mode and additionally verifies that each returned source excerpt appears in the submitted policy. The model is used only for interpretation. Python validation and later deterministic services own all policy checks, calculations, and event detection.

Groq can return HTTP 429 when its free-tier/request limits are reached. The endpoint returns a clear 429 without automatically retrying, avoiding surprise usage; wait and retry later. Authentication, timeout, unavailable-model, malformed-output, and network failures also return safe errors rather than crashing the application.
