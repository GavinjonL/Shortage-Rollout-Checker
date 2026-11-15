# Prototype build checklist

This checklist tracks the current Builder Plan against the repository as of November 14, 2026. A checked item is implemented and verified in the prototype; an unchecked item with a status note is partially implemented or still needed.

## Sprint status

- [ ] **Sprint 1 — Project foundation and data contract:** most of the structure, fixtures, load action, health endpoint, and local setup are present. Finish the six-event fixture requirement, fully mirror shared types in the frontend, and make reset restore the backend fixture state.
- [ ] **Sprint 2 — API key setup and policy intake:** policy extraction, source excerpts, error handling, and a mock extractor exist. Finish the safe AI connectivity check, tool schemas/dispatcher, editable policy input, backend confirmation flow, and a mock mode that completes the whole intake path.
- [ ] **Sprint 3 — Rollout checker and evidence review:** the review UI, filters, local status actions, and seeded findings exist. Implement the deterministic backend comparison and connect the page to its resulting findings and evidence.
- [ ] **Sprint 4 — Flight Simulator and Ripple Map:** the frontend presents three cases and an interactive ripple calculation. Implement validated backend evaluation, projection services, and shared-data integration.
- [ ] **Sprint 5 — Shadow Mode:** the read-only UI and local review controls exist. Implement deterministic event comparison, grouping, and generated findings from the shared fixture data.
- [ ] **Sprint 6 — Integration, demo hardening, and presentation:** complete after the remaining P0 services are connected, the clean-reset walkthrough passes, and both live and mock flows work end to end.

## Product backlog

### Epic A — Project setup and shared data

- [x] **A1 (P0):** Frontend/backend projects and local start instructions exist.
- [x] **A2 (P0):** `.gitignore` covers environment files, caches, and build output.
- [x] **A3 (P0):** `.env.example` contains provider/model placeholders and no credential.
- [ ] **A4 (P0):** Define and mirror every shared schema, including `ShortagePolicy`, across frontend and backend. Backend coverage is largely present; frontend types and a named `ShortagePolicy` model remain incomplete.
- [ ] **A5 (P0):** Complete the fictional seed scenario. It has two departments, three medications, an approved alternative, and a mismatch; add at least two more events to reach six.
- [ ] **A6 (P0):** Make reset and Load demo data restore the same backend fixture state. Loading calls `GET /api/demo`; reset is still browser-local.
- [ ] **A7 (P1):** Add CSV/JSON import with row-level validation errors.
- [x] **A8 (P0):** Backend health endpoint and frontend-to-backend request configuration exist.

### Epic B — API key and model connection

- [ ] **B1 (P0):** Document the backend-local `.env` location precisely and consistently. Current instructions use a root `.env`.
- [ ] **B2 (P0):** Add explicit live-mode startup validation for OpenAI settings. Current validation occurs when extraction is requested and also supports Groq.
- [ ] **B3 (P0):** Add a safe backend AI connectivity-check endpoint.
- [x] **B4 (P0):** Keep API keys server-side; no frontend key usage is present.
- [x] **B5 (P0):** Return readable errors for missing keys, auth, rate limits, timeouts, network, model, and malformed-output failures.
- [ ] **B6 (P0):** Make mock-AI mode complete the full policy-intake demo. Current mock mode intentionally returns no rules.
- [ ] **B7 (P1):** Add a privacy-safe model-call status log.
- [ ] **B8 (P0):** Define strict schemas for the read-only AI function tools.
- [ ] **B9 (P0):** Implement the allowlisted, validated backend tool dispatcher.

### Epic C — Policy intake and confirmation

- [ ] **C1 (P0):** Allow users to paste fictional approved policy text. The current policy text field is read-only.
- [ ] **C2 (P0):** Use the planned Responses API structured-output call. Current extraction uses an OpenAI-compatible chat-completions API.
- [x] **C3 (P0):** Store source excerpts for extracted candidate rules.
- [x] **C4 (P0):** Validate drafts and surface ambiguities for review.
- [ ] **C5 (P0):** Persist pharmacist edits, confirmations, and rejections through the backend. Current review actions are browser-local.
- [ ] **C6 (P0):** Enforce confirmation on backend feature calls as well as the current frontend gate.
- [ ] **C7 (P1):** Add reopen/revision and simple version history for confirmed rules.

### Epic D — Rollout checker

- [x] **D1 (P0):** Display mock configuration records by system, medication, and department.
- [ ] **D2 (P0):** Implement deterministic backend comparisons of confirmed rules and configuration records.
- [ ] **D3 (P0):** Generate mismatch findings through the deterministic checker. Current findings are seeded static data.
- [x] **D4 (P0):** Provide Rollout Review filters for department, system, and status.
- [x] **D5 (P0):** Provide local review-status actions and optional notes.
- [ ] **D6 (P1):** Export the reviewed checklist to CSV or a printable page.

### Epic E — Shortage Flight Simulator

- [x] **E1 (P0):** Provide three supplied sample cases.
- [x] **E2 (P0):** Validate every runnable case with the backend `TestCase` schema; generated cases can be checked through `POST /api/simulator/validate`.
- [x] **E3 (P0):** Implement the deterministic backend evaluator with explicit pass, possible-mismatch, and needs-clarification outcomes.
- [x] **E4 (P0):** Show static demo results with expected/observed behavior and evidence.
- [x] **E5 (P0):** Label simulations as supplied-data, review-only results.
- [x] **E6 (P1):** Allow an in-memory mock-configuration edit and rerun without changing a live system.

### Epic F — Shortage Ripple Map

- [ ] **F1 (P0):** Enforce approved-only alternative links in application code. The approved link is present in fixtures.
- [x] **F2 (P0):** Calculate a transparent browser-side projection from supplied quantities and use rates.
- [ ] **F3 (P0):** Validate missing, negative, and inconsistent inventory values comprehensively.
- [x] **F4 (P0):** Display medication/location nodes and directional use shift.
- [x] **F5 (P0):** Show formula, inputs, assumptions, and non-recommendation labeling.
- [ ] **F6 (P1):** Compare two scenarios side by side.

### Epic G — Shadow Mode

- [ ] **G1 (P0):** Load the event stream from the shared local fixture in the feature page. The UI currently uses its own static event list.
- [ ] **G2 (P0):** Deterministically compare events with confirmed rules.
- [ ] **G3 (P0):** Group repeated deviations by policy, department, event type, and time window.
- [ ] **G4 (P0):** Generate evidence-backed grouped findings from the analyzer. Current pattern data is static.
- [x] **G5 (P0):** Provide a clearly read-only, review-only Shadow Mode page.
- [x] **G6 (P0):** Provide local Expected, Dismissed, and Review policy controls with a note field.
- [ ] **G7 (P1):** Allow a confirmed Shadow Mode finding to become a simulator case.

### Epic H — Shared interface and evidence

- [x] **H1 (P0):** Navigate across the six main feature pages.
- [x] **H2 (P0):** Reuse finding cards with severity, status, summary, and evidence identifiers.
- [ ] **H3 (P0):** Build one full detail panel with policy excerpt, source record, assumptions, calculation inputs, and review history.
- [ ] **H4 (P0):** Add complete loading, empty, validation-error, API-error, and mock-data states to every main page.
- [x] **H5 (P0):** Show demo-data labels and reset controls.
- [ ] **H6 (P1):** Complete keyboard navigation, contrast, and status-icon accessibility review.

### Epic I — Integration, validation, and presentation

- [ ] **I1 (P0):** Connect all feature pages to the same confirmed policy and shared demo dataset.
- [x] **I2 (P0):** Maintain a concise demo script.
- [ ] **I3 (P0):** Perform and record a clean-reset walkthrough of every scripted button.
- [x] **I4 (P0):** Keep the committed demo fictional and free of production write actions.
- [ ] **I5 (P0):** Rehearse and visibly distinguish full live-AI and full mock-AI modes.
- [ ] **I6 (P1):** Obtain pharmacist or pharmacy-informatics wording/boundary review.

### Epic J — Future work

- [ ] **J1 (P2):** Validate the claimed market distinction with incumbent vendors.
- [ ] **J2 (P2):** Review the workflow with hospital pharmacists and pharmacy-informatics staff.
- [ ] **J3 (P2):** Explore secure, read-only health-system integrations.
- [ ] **J4 (P2):** Review privacy, security, governance, and deployment requirements.
- [ ] **J5 (P2):** Evaluate accuracy, missed issues, review time, and staff trust with approved evaluation data.

## Recommended next sequence

1. Finish remaining Sprint 1 fixture and shared-contract gaps: six events, frontend shared types, and backend-backed reset.
2. Complete Sprint 2 safety/integration gaps: backend confirmation, tool dispatcher, safe connectivity check, and usable mock policy drafting.
3. Build the deterministic rollout checker before connecting the simulator, Ripple Map, and Shadow Mode to the shared dataset.
4. Finish the end-to-end clean-reset rehearsal and presentation hardening only after every P0 feature uses the same evidence records.
