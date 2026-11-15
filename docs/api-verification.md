# Policy and API verification

The previous Rollout Review UI displayed a fixed frontend queue. It now requests `/api/rollout/findings`, using the current confirmed rules and active mock configuration data. Simulator, Ripple Map, and Shadow Mode now share those confirmed rules instead of independently using the seeded policy. The overview no longer begins with canned findings or activity.

## Configuration and restart

Restart the backend and refresh the frontend after updating. From `backend`, run `.\scripts\run_backend.ps1`; start the frontend with `npm run dev` in another terminal. Keep one backend worker: policy state and diagnostics are in memory and are cleared on server restart. Browser refresh clears the local draft/review state; extract and confirm again to reestablish the review session. This prototype has shared local state, not separate user sessions.

The provider reads process environment first, then `backend/.env`, then repo-root `.env` for values still missing. A setting already supplied by the process wins. Set `AI_PROVIDER=groq`, `GROQ_API_KEY`, and `GROQ_MODEL=openai/gpt-oss-120b`. Keys stay in Python; never put them in frontend variables. `frontend/.env` may set `VITE_API_URL=http://localhost:8000`; restart Vite after changing it. Backend `FRONTEND_ORIGINS` must include the exact browser origin. `AI_PROVIDER=mock` is explicitly offline and never validates credentials.

## What each feature actually does

| Feature | Browser/backend requests | Calls AI provider? | Data and behavior |
| --- | --- | --- | --- |
| Policy Setup: Create draft | `POST /api/policies/extract` | Yes, once in live mode | Sends the policy text to the configured provider with a strict JSON schema. Validates returned excerpts against the input. Errors are displayed; there is no silent fallback to mock. |
| Connection diagnostics | `GET /api/ai/status` | No | Shows provider, model, whether a key is present, and completed provider-call records. Presence of a key alone does not prove it works. |
| Explicit connection test | `POST /api/ai/check` | Yes, once in live mode | Sends a small fictional extraction request. Mock returns offline status. |
| Rule confirmation | `PUT /api/policies/confirmed`, `POST /api/policies/rules/review` | No | Activates only reviewed rules. Editing or reopening a rule removes its confirmation; replacing the source or creating a new draft invalidates the old frontend rules. Starting extraction and resetting demo data clear the active backend rules. Rejected rules do not block the remaining confirmed rules. |
| Rollout Review | `GET /api/rollout/findings` | No | Python compares confirmed restrictions against current mock configuration records by medication and department ID. Shows returned findings, source records, empty states, and errors. Imported configurations affect this comparison. |
| Flight Simulator | `GET /api/simulator/cases`, `POST /api/simulator/cases/{id}/run` | No | Binds matching fictional cases to the current confirmed rule. Changing mock instruction text affects deterministic results; old cases are refused when the rule no longer matches. |
| Ripple Map | `GET /api/ripple/projection` | No | Requires a confirmed alternative, matching approved alternative link, and valid inventory. Calculates `(quantity_on_hand - minimum_reserve) / (baseline_daily_use * (1 + shift_percent/100))`. Explains missing inputs rather than silently substituting a seeded policy. |
| Shadow Mode | `GET /api/shadow/findings` | No | Groups repeated allowed events by confirmed restricted medication, department, event type, and fixed time window. No real-time hospital feed is connected. Follow-up cases enter the simulator after explicit reviewer action. |
| Overview and activity | Demo/rollout API reads; local activity state | No | Overview findings come from the rollout endpoint. Activity reflects this browser session; it is not a durable audit database. Rollout finding review statuses/notes are local to the page and reset on reload. Shadow reviews are stored in server memory. |
| Mock data import/reset | `/api/demo/import/{table}`, `/api/demo/reset` | No | Validates fictional rows and updates in-memory source data. Reload the relevant page after import. Reset also clears active confirmed rules. Imported `findings` are reference data and are not treated as generated rollout results. |

The read-only function-tool dispatcher exists for future integration; the extraction request does not run an autonomous AI tool loop. These deterministic features do not need extra provider calls to work.

## Fresh sample and expected results

Paste the contents of `sample-policy-api-test.txt` into Policy Setup (fictional data only). Click **Create draft**. The provider status below the source text should show `groq`, `live`, a request count, and `success`. Review the excerpt, IDs, date, restriction, alternative, and any ambiguities; the model can omit or misinterpret details. Confirm only the intended rule. Reject unrelated extra drafts rather than confirming unsupported rules.

Use these exact source identifiers:

- Medication: `med-a-iv`
- Department: `dept-emergency`
- Approved alternative: `med-b-oral`
- Effective date: `2026-11-15`

With one confirmed restriction for those IDs and baseline demo data, Rollout Review returns one possible mismatch for `ehr-demo-001`: its instruction still allows routine use. The dispensing-cabinet record already contains restriction guidance. The sample simulator has matching cases; Ripple Map can project `med-b-oral` if the alternative was extracted and confirmed; Shadow Mode finds repeated allowed events in `dept-emergency`.

For a contrasting input, replace every `dept-emergency` in the sample with `dept-infusion`, then create a fresh draft and confirm its rule. The new extraction should add one provider call. Rollout Review should return zero findings because the baseline data has no `med-a-iv` configuration in that department. Simulator has no matching sample case; Shadow Mode has no matching repeated events. Ripple can still project supply because it uses medication/alternative inventory rather than a department-specific configuration. Zero findings is not proof that a policy has been implemented.

## Prove the provider call

Open browser developer tools, Network, and click Create draft. Expect a browser `POST /api/policies/extract`, then `GET /api/ai/status`. The browser does not contact Groq directly; the backend makes that request so the key stays private.

In PowerShell, with your server running:

```powershell
$before = Invoke-RestMethod http://localhost:8000/api/ai/status
# Click Create draft in the browser, then:
$after = Invoke-RestMethod http://localhost:8000/api/ai/status
$before.calls.Count
$after.calls.Count
$after.calls | Select-Object -Last 1 | Format-List
```

A successful live record includes `status=success`, provider/model, duration, completion time, provider response ID, and SHA-256 of the submitted text. It contains neither the API key nor policy text. The count should increase by one per extraction, assuming no concurrent requests. Failures also appear with their error status. Mock requests do not add provider-call records. Counts reset when the backend restarts. Compare provider usage in your Groq Console for independent confirmation.

For a repeatable standalone check, from `backend`:

```powershell
.\.venv\Scripts\python.exe scripts/verify_policy_flow.py
```

This makes ONE real provider request and exercises extraction, confirmation, rollout, simulator, Shadow Mode, changing the confirmed department, and clearing confirmation. It prints `PASS` and provider-call evidence. It runs an isolated app process and does not change your running server's state or its call counter. Uses the test extras (`pip install -e ".[test]"`). Offline tests (`pytest`) make no real provider calls.

## Limits to interpret correctly

This remains a narrow fictional prototype. Rollout uses simple text checks for restrictions and stale instructions; it does not semantically evaluate every policy condition, date, or configuration. Simulator supports the supplied shortage/eligibility scenarios and checks instruction phrases. Unsupported policies or missing records can produce no findings or require clarification. Findings are review evidence, not proof of clinical correctness or complete rollout coverage. No hospital systems are connected or modified.

Live verification during this fix succeeded with Groq `openai/gpt-oss-120b`: one request produced a real draft and provider response ID; confirming the matching rule returned one rollout finding; changing the department returned zero. Review is still required: the model raised a condition ambiguity even for the sample.


## Why the earlier samples gave the same finding

ZX-731 and LIVE-842 both restricted med-a-iv in dept-emergency. With unchanged mock records, both therefore flagged ehr-demo-001. Adding a med-c-reserve rule did not create another mismatch under the limited text checks. Presenting these as contrasting tests was incorrect.

The review now lists every received rule, its original source excerpt, confirmed condition/restriction/date, policy fingerprint, matching source records, and comparison reasons. Generic wording such as "guidance is current" is explicitly Needs clarification rather than silently treated as a successful comparison. Unmatched configurations show Not evaluated. Conditions, dates and alternatives remain manual review items.

Use sample-policy-contrast-a.txt and sample-policy-contrast-b.txt separately for genuinely different tests. A checks the EHR and cabinet records and has one mismatch. B checks pump-demo-001, has zero mismatch findings, and explicitly Needs clarification. This is not an alignment claim.

Both samples were actually extracted by Groq and compared during verification. Full draft, provider response ID, source records and outcomes are saved in policy-contrast-results.json. Reproduce this with `python scripts/verify_policy_contrast.py` from backend; it makes two provider calls in an isolated process and leaves the running server policy unchanged.
