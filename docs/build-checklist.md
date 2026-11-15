# Prototype build checklist

This checklist tracks the current Builder Plan against the repository as of November 14, 2026. A checked item is implemented and verified in the prototype; an unchecked item with a status note is partially implemented or still needed.

## Sprint status

- [ ] **Sprint 1 — Project foundation and data contract:** most of the structure, fixtures, load action, health endpoint, and local setup are present. Finish the six-event fixture requirement, fully mirror shared types in the frontend, and make reset restore the backend fixture state.
- [ ] **Sprint 2 — API key setup and policy intake:** policy extraction, source excerpts, error handling, and a mock extractor exist. Finish the safe AI connectivity check, tool schemas/dispatcher, editable policy input, backend confirmation flow, and a mock mode that completes the whole intake path.
- [ ] **Sprint 3 — Rollout checker and evidence review:** deterministic backend comparison and finding generation now exist, alongside the review UI and controls. Connect the UI to those shared backend findings and persist review decisions.
- [ ] **Sprint 4 — Flight Simulator and Ripple Map:** the Flight Simulator now uses validated backend cases and deterministic results; the Ripple Map has a backend projection service. Connect the Ripple UI to shared backend projection data and finish approved-link enforcement and input validation.
- [ ] **Sprint 5 — Shadow Mode:** a read-only backend event analyzer now detects repeated events, and the UI has local review controls. Add time-window-aware grouping and connect the page to shared backend events and findings.
- [ ] **Sprint 6 — Integration, demo hardening, and presentation:** complete after the remaining P0 services are connected, the clean-reset walkthrough passes, and both live and mock flows work end to end.

## Product backlog

### Epic A — Project setup and shared data

- [x] **A1 (P0):** Frontend/backend projects and local start instructions exist.
- [x] **A2 (P0):** `.gitignore` covers environment files, caches, and build output.
- [x] **A3 (P0):** `.env.example` contains provider/model placeholders and no credential.
- [x] **A4 (P0):** Shared backend schemas are mirrored as frontend TypeScript contracts, including `ShortagePolicy`.
- [x] **A5 (P0):** The fictional seed scenario has two departments, three medications, one approved alternative, one mismatch, and six mock events.
- [x] **A6 (P0):** Load and reset use the same backend fixture state; reset restores the in-memory demo from committed fixtures.
- [x] **A7 (P1):** CSV/JSON imports validate every row and return row-level field errors without partially applying invalid files.
- [x] **A8 (P0):** Backend health endpoint and frontend-to-backend request configuration exist.

### Epic B — API key and model connection

- [x] **B1 (P0):** Backend-local `backend/.env` and `backend/.env.example` are documented consistently and ignored by Git.
- [x] **B2 (P0):** Live Groq/OpenAI mode validates required credentials at startup; mock mode remains available without credentials.
- [x] **B3 (P0):** Safe backend-only `POST /api/ai/check` endpoint added; it returns provider/model status without credentials.
- [x] **B4 (P0):** Keep API keys server-side; no frontend key usage is present.
- [x] **B5 (P0):** Return readable errors for missing keys, auth, rate limits, timeouts, network, model, and malformed-output failures.
- [x] **B6 (P0):** Mock-AI mode returns a labeled, confirmable deterministic fictional draft for the policy-intake demo.
- [x] **B7 (P1):** Privacy-safe model-call log records purpose, duration, and status only.
- [x] **B8 (P0):** Strict schemas cover the implemented read-only policy, configuration, test-case, simulation, inventory, ripple, and event tools.
- [x] **B9 (P0):** Allowlisted dispatcher rejects unknown, write-capable, and unexpected-argument tool requests.

### Epic C — Policy intake and confirmation

- [x] **C1 (P0):** Users can paste or load fictional approved policy text and submit it to the backend.
- [x] **C2 (P0):** Extraction uses the OpenAI-compatible Responses API with strict structured JSON output.
- [x] **C3 (P0):** Store source excerpts for extracted candidate rules.
- [x] **C4 (P0):** Validate drafts and surface ambiguities for review.
- [x] **C5 (P0):** Editable fields plus draft, confirmed, and rejected review actions persist through the backend.
- [x] **C6 (P0):** Backend rollout, simulator, ripple, and Shadow Mode services use confirmed rules only.
- [x] **C7 (P1):** Confirmed rules can be reopened as drafts; review versions are persisted and visible in Policy Setup.

### Epic D — Rollout checker

- [x] **D1 (P0):** Display mock configuration records by system, medication, and department.
- [x] **D2 (P0):** Deterministically compare confirmed rules with mock configuration records in the backend.
- [x] **D3 (P0):** Generate mismatch findings with rule and source-record evidence through the deterministic checker.
- [x] **D4 (P0):** Provide Rollout Review filters for department, system, and status.
- [x] **D5 (P0):** Provide local review-status actions and optional notes.
- [x] **D6 (P1):** Export the reviewed checklist to CSV and provide a printable checklist view.

### Epic E — Shortage Flight Simulator

- [x] **E1 (P0):** Provide three supplied sample cases.
- [x] **E2 (P0):** Validate every runnable case with the backend `TestCase` schema; generated cases can be checked through `POST /api/simulator/validate`.
- [x] **E3 (P0):** Implement the deterministic backend evaluator with explicit pass, possible-mismatch, and needs-clarification outcomes.
- [x] **E4 (P0):** Show static demo results with expected/observed behavior and evidence.
- [x] **E5 (P0):** Label simulations as supplied-data, review-only results.
- [x] **E6 (P1):** Allow an in-memory mock-configuration edit and rerun without changing a live system.

### Epic F — Shortage Ripple Map

- [x] **F1 (P0):** Enforce approved-only alternative links in the backend projection service.
- [x] **F2 (P0):** Calculate a transparent projection from supplied quantities and use rates in both the backend service and current browser demo.
- [x] **F3 (P0):** Validate missing, negative, zero-use, and reserve-inconsistent inventory values before a backend projection is returned.
- [x] **F4 (P0):** Display medication/location nodes and directional use shift.
- [x] **F5 (P0):** Show formula, inputs, assumptions, and non-recommendation labeling.
- [x] **F6 (P1):** Compare two user-selected scenarios side by side using the shared backend projection.

### Epic G — Shadow Mode

- [x] **G1 (P0):** Load the fictional event stream in the read-only backend analyzer. The feature page still needs to consume it.
- [x] **G2 (P0):** Deterministically compare relevant allowed events with confirmed rules in the backend.
- [x] **G3 (P0):** Group repeated events in the backend by confirmed policy rule, department, event type, and configurable time window.
- [x] **G4 (P0):** Render shared findings with event count, representative evidence IDs, time window, and reason in Shadow Mode.
- [x] **G5 (P0):** Provide a clearly read-only, review-only Shadow Mode page.
- [x] **G6 (P0):** Provide review-only Expected, Dismissed, and Review policy actions with note support in the backend and local UI.
- [x] **G7 (P1):** Allow the user to explicitly create a follow-up Flight Simulator case from a Shadow Mode finding.

### Epic H — Shared interface and evidence

- [x] **H1 (P0):** Navigate across the six main feature pages.
- [x] **H2 (P0):** Reuse finding cards with severity, status, summary, and evidence identifiers.
- [x] **H3 (P0):** Rollout Review includes a complete evidence panel with policy excerpt, source record, assumptions, comparison inputs, and activity-backed review history.
- [x] **H4 (P0):** Verified loading, empty, validation-error, API-error, and fictional mock-data states across the main demo pages.
- [x] **H5 (P0):** Show demo-data labels and reset controls.
- [ ] **H6 (P1):** Complete keyboard navigation, contrast, and status-icon accessibility review.

### Epic I — Integration, validation, and presentation

- [x] **I1 (P0):** Connect all feature pages to the same confirmed policy and shared fictional demo dataset.
- [x] **I2 (P0):** Maintain a concise demo script.
- [x] **I3 (P0):** Clean-reset mock-mode browser walkthrough passed and is recorded in `docs/clean-reset-walkthrough.md`.
- [x] **I4 (P0):** Keep the committed demo fictional and free of production write actions.
- [x] **I5 (P0):** Mock and live Groq rehearsals passed with visible mode labels; results are recorded in `docs/clean-reset-walkthrough.md`.
- [x] **I6 (P1):** Pharmacist review approved the fictional, review-only wording and safety boundaries; the record is in `docs/pharmacist-review-packet.md`.

### Epic J — Future work

- [ ] **J1 (P2):** Validate the claimed market distinction with incumbent vendors. Readiness protocol: `docs/future-work-readiness.md`.
- [ ] **J2 (P2):** Review the workflow with hospital pharmacists and pharmacy-informatics staff. Readiness protocol: `docs/future-work-readiness.md`.
- [ ] **J3 (P2):** Explore secure, read-only health-system integrations. Readiness architecture/checklist: `docs/future-work-readiness.md`.
- [ ] **J4 (P2):** Review privacy, security, governance, and deployment requirements. Readiness checklist: `docs/future-work-readiness.md`.
- [ ] **J5 (P2):** Evaluate accuracy, missed issues, review time, and staff trust with approved evaluation data. Evaluation protocol: `docs/future-work-readiness.md`.

## Recommended next sequence

1. Finish remaining Sprint 1 fixture and shared-contract gaps: six events, frontend shared types, and backend-backed reset.
2. Complete Sprint 2 safety/integration gaps: backend confirmation, tool dispatcher, safe connectivity check, and usable mock policy drafting.
3. Connect the existing rollout, Ripple Map, and Shadow Mode backend services to their respective pages and the same confirmed policy state; finish the remaining comparison and follow-up-case UI controls.
4. Finish the end-to-end clean-reset rehearsal and presentation hardening only after every P0 feature uses the same evidence records.
