# Shortage Rollout Checker — Builder Plan

**Plan date:** November 14, 2026  
**Plan audience:** Hackathon builders  
**Working product name:** Shortage Rollout Checker  
**Product form:** Browser-based web app  
**Hackathon mode:** Fictional data; no special hardware or live hospital connection

## 1. Product summary

Shortage Rollout Checker helps hospital pharmacy teams test and verify how an already-approved medication-shortage policy is applied across a hospital’s systems. It combines four features:

1. **Policy Rollout Checker:** maps a confirmed policy to potentially affected systems and flags inconsistencies.
2. **Shortage Flight Simulator:** tests sample orders against the policy before rollout.
3. **Shortage Ripple Map:** models how an approved alternative could shift supply pressure across medications, departments, or locations.
4. **Shadow Mode:** observes a fictional, read-only stream after rollout and surfaces repeated unexpected patterns.

The product is an implementation and verification layer. It is not a shortage forecasting platform, clinical decision-support system, or medication recommender.

### Product statement

> Help pharmacy teams test, roll out, and monitor approved shortage policies so outdated instructions and unexpected workflow problems are easier to find.

## 2. Product problem

When a hospital changes how a medication is used during a shortage, staff may need to update several places: EHR order sets, automated dispensing cabinets, smart-pump settings, purchasing records, and staff instructions. If those places do not agree, staff may encounter outdated or confusing workflows.

ASHP guidance describes coordinating updates across systems such as EHRs, smart-pump libraries, and automated dispensing cabinets as part of shortage management. It also notes that alternative medications can be affected by increased demand. See [ASHP Guidelines on Managing Drug Product Shortages](https://academic.oup.com/ajhp/article/75/21/1742/5160014).

### Specific problem

**After a pharmacy team approves a shortage policy, how can the team check that it is applied consistently, test likely edge cases before rollout, and notice unexpected patterns afterward?**

### Market assumption to validate

Existing products already offer shortage forecasting, inventory visibility, scenario planning, sourcing, and collaboration. The proposed opportunity is the narrower workflow of policy testing and rollout verification. Public product descriptions do not prove that incumbent products lack this capability. Pharmacist interviews and vendor demos are needed before claiming this is a market gap.

## 3. Product vision

Create a human-reviewed “preflight and follow-through” workspace for shortage policies:

1. **Prepare:** capture the approved policy and identify affected departments and systems.
2. **Preflight:** simulate sample orders and supply changes before launch.
3. **Roll out:** show a reviewable checklist of possible system updates and owners.
4. **Monitor:** compare read-only post-rollout events with expected behavior and surface recurring surprises.

The app should help the team answer: **“Did we apply the plan consistently, and is it behaving as expected?”**

## 4. Target audience

### Primary users

- Hospital pharmacists coordinating medication-shortage responses
- Pharmacy informatics staff
- Medication-safety analysts

### Supporting users

- Pharmacy buyers and technicians
- EHR analysts and medication-system administrators
- Nursing or clinical-education leads
- Pharmacy directors overseeing rollout status

### Likely buyer

A hospital pharmacy department or health-system pharmacy operations team. The hackathon prototype demonstrates a workflow; it is not a procurement-ready product.

## 5. Product scope

### In scope for the hackathon

- Browser-based dashboard
- Fictional, non-patient medication and department data
- Seeded demo data and optional CSV/JSON fixture import
- Approved-policy intake using pasted text or a sample document
- AI-assisted conversion of policy language into a reviewable draft
- Human confirmation of extracted rules
- Rollout checklist and mismatch review
- Flight Simulator using generated or seeded sample orders
- Ripple Map using fictional inventory and pharmacist-approved alternative links
- Shadow Mode over fictional, read-only events
- Evidence and assumptions shown with every finding
- Human review states and demo activity history

### Out of scope for the hackathon

- Real patient data or protected health information
- Diagnosis, prescribing, medication substitution, or patient prioritization
- Automated writes to EHRs, cabinets, smart pumps, procurement systems, or live data
- Claims that a finding is clinically correct without pharmacist review
- Production hospital integrations, security certification, or regulatory validation
- Predicting national shortages or replacing incumbent shortage platforms
- Meta Glasses or other specialized hardware

## 6. Feature definitions

### 6.1 Policy Rollout Checker

The pharmacist provides an approved policy. The app drafts a structured view of relevant rules: medication, department, condition, restriction, approved alternative if specified, effective date, and source text. The pharmacist confirms or edits the draft. The app compares confirmed rules with mock system records and flags possible mismatches.

### 6.2 Shortage Flight Simulator

Before rollout, the agent drafts sample cases based on confirmed rules. A deterministic rules engine checks those cases against the policy and mock system configuration. Results show expected behavior, observed behavior, and the rule involved.

Example: a sample order from a restricted department appears allowed in an imported EHR configuration. The app flags this for review; it does not change the configuration.

### 6.3 Shortage Ripple Map

The map shows how a pharmacist-approved alternative may affect inventory in other departments or locations. It uses fictional or imported quantities, usage rates, and approved alternative links. Application code performs the calculations; the language model does not invent the math.

Each connection shows its assumptions and source data—for example, “Alternative B is approved for this scenario” and “projected use is based on the supplied mock rate.”

### 6.4 Shadow Mode

After rollout, Shadow Mode reads a fictional event stream and compares observed events with confirmed policy rules. It groups repeated patterns—such as recurring workarounds or usage that differs from expectations—and presents them for pharmacist review.

Shadow Mode is read-only. It does not block orders, alter clinical workflows, or send instructions to staff.

### 6.5 Evidence and activity history

Each finding includes the relevant policy rule, record, calculation assumptions, and review status. The activity history shows who confirmed or dismissed a finding in the demo.

## 7. AI model and system design

### Recommended model

Use **`gpt-5.5` through the OpenAI Responses API** for policy interpretation, clarification questions, test-case drafting, and concise explanations. OpenAI’s API documentation currently lists GPT-5.5 with function calling and structured-output support. Confirm API access for the hackathon account before building; keep the model name in an environment variable so it can be changed if needed. References: [OpenAI API models](https://developers.openai.com/api/docs/models), [API changelog](https://developers.openai.com/api/docs/changelog), [function calling](https://developers.openai.com/api/docs/guides/function-calling), and [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

### What the model does

- Extracts candidate rules from pharmacist-provided policy text
- Identifies ambiguity and asks the user to clarify it
- Drafts test scenarios from confirmed rules
- Chooses among a small set of read-only application tools
- Groups similar Shadow Mode events for review
- Explains deterministic results in plain language with evidence references

### What ordinary code does

- Validates model output against schemas
- Calculates inventory and scenario changes
- Runs policy checks against test orders and mock configurations
- Builds the Ripple Map from approved links and supplied inventory data
- Groups events using defined conditions and thresholds
- Enforces review states and audit records

The model must not decide what treatment is appropriate, invent approved alternatives, or execute production changes.

### Proposed read-only tools

- `get_confirmed_policy(policy_id)`
- `get_mock_configuration(policy_id)`
- `get_sample_orders(policy_id, scenario_id)`
- `run_policy_simulation(policy_id, scenario_id)`
- `get_inventory_snapshot(medication_ids)`
- `build_ripple_projection(policy_id, scenario_id)`
- `get_shadow_events(policy_id, time_window)`
- `create_review_finding(finding_payload)`
- `update_review_status(finding_id, status, note)`

Do not implement tools that modify live policy, inventory, or system configuration.

## 8. Data model for the demo

Use fictional medication IDs and names. Every record should have a stable ID so findings can point back to their evidence.

- **PolicyRule:** `id`, `policy_id`, `medication_id`, `department_id`, `condition`, `restriction`, `approved_alternative_id`, `effective_date`, `source_excerpt`, `confirmed_by_user`
- **SystemConfig:** `id`, `system_type`, `department_id`, `medication_id`, `enabled`, `instruction_text`, `source_record_id`
- **TestCase:** `id`, `policy_id`, `department_id`, `medication_id`, `scenario_text`, `expected_outcome`, `source_rule_id`
- **Inventory:** `medication_id`, `location_id`, `quantity_on_hand`, `average_daily_use`, `minimum_reserve`
- **AlternativeLink:** `source_medication_id`, `alternative_medication_id`, `approved_condition`, `approved_by_role`
- **ShadowEvent:** `id`, `timestamp`, `department_id`, `medication_id`, `event_type`, `result`, `source_record_id`
- **Finding:** `id`, `feature`, `severity`, `summary`, `evidence_ids`, `assumptions`, `review_status`, `created_at`

No patient names, identifiers, or real patient-level clinical records belong in the demo dataset.

## 9. Language and safety rules

### Use plain, neutral wording

- “Possible mismatch — pharmacist review needed”
- “Simulation result — based on supplied sample data”
- “Observed pattern — no change made”
- “The policy text does not specify this case”

Avoid statements such as “The AI recommends this medication” or “This order is unsafe.” Describe the record and the policy rule that appears inconsistent; leave the clinical judgment to the pharmacist.

### Data and approval rules

- Use fictional data for the demo.
- Require a human to confirm extracted policy rules before simulation.
- Clearly label assumptions, mock data, and AI-generated drafts.
- Keep API credentials on the backend, never in browser code.
- Keep all feature outputs review-only and traceable to their source records.

## 10. Interface outline

1. **Overview:** active demo policies and unresolved findings.
2. **Policy Setup:** paste or upload sample policy text and review extracted rules.
3. **Rollout Review:** affected mock systems, departments, and possible mismatches.
4. **Flight Simulator:** choose a scenario, run sample orders, review results.
5. **Ripple Map:** inspect medications, departments, inventory assumptions, and projected changes.
6. **Shadow Mode:** view event patterns and compare them with expected policy behavior.
7. **Finding Detail:** evidence, rule, data source, assumptions, and review controls.
8. **Activity History:** prototype actions and review status.

Use a contextual AI explanation panel inside each feature. Lead with evidence and status, not a blank chatbot screen.

## 11. Product backlog

Priority key: **P0** required for the demo; **P1** improves the demo; **P2** future work.

### Epic A — Foundation and demo data

- **A1 (P0):** Create frontend and backend projects with local setup instructions.
- **A2 (P0):** Define shared schemas for policies, medications, departments, configurations, inventory, alternatives, events, and findings.
- **A3 (P0):** Create fictional data with two departments, three medications, one approved alternative link, one configuration mismatch, and several Shadow Mode events.
- **A4 (P0):** Add an in-app “Load demo data” action.
- **A5 (P1):** Support CSV import for selected mock tables.

### Epic B — Policy intake

- **B1 (P0):** Add policy text input or sample upload.
- **B2 (P0):** Use the model to draft structured rules with source excerpts.
- **B3 (P0):** Validate the draft against a schema and show missing or unclear fields.
- **B4 (P0):** Require user confirmation before other features can use a policy.
- **B5 (P1):** Allow editing and versioning in the demo.

### Epic C — Rollout checker

- **C1 (P0):** Display mock system records linked to a selected policy.
- **C2 (P0):** Compare confirmed rules with records using deterministic checks.
- **C3 (P0):** Display mismatches with evidence and review status.
- **C4 (P1):** Let a reviewer mark a finding expected, dismissed, or needing follow-up.
- **C5 (P1):** Export a rollout checklist.

### Epic D — Flight Simulator

- **D1 (P0):** Generate or load sample order scenarios from confirmed rules.
- **D2 (P0):** Run scenarios through deterministic policy checks.
- **D3 (P0):** Show expected behavior versus observed configuration behavior.
- **D4 (P0):** Show “simulation only” labels and assumptions.
- **D5 (P1):** Allow reruns after policy or mock-configuration edits.

### Epic E — Ripple Map

- **E1 (P0):** Represent approved alternative relationships as directed links.
- **E2 (P0):** Calculate projected use and days-of-supply changes from mock inputs.
- **E3 (P0):** Display a graph view of potential shifts.
- **E4 (P0):** Show input quantities, formula, assumptions, and missing values.
- **E5 (P1):** Compare two user-selected scenarios side by side.

### Epic F — Shadow Mode

- **F1 (P0):** Load a fictional, read-only event stream.
- **F2 (P0):** Compare events with confirmed policy rules using deterministic conditions.
- **F3 (P0):** Group repeated exceptions or deviations into findings.
- **F4 (P0):** Show event count, time window, relevant records, and reason flagged.
- **F5 (P0):** Keep findings review-only; implement no order blocking or system writes.
- **F6 (P1):** Allow a reviewer to mark findings expected, dismissed, or for policy review.

### Epic G — Agent and evidence

- **G1 (P0):** Connect the backend to the Responses API using a server-side API key.
- **G2 (P0):** Define a small set of read-only function tools.
- **G3 (P0):** Use Structured Outputs for policy drafts, test-case drafts, and explanations.
- **G4 (P0):** Attach source excerpts or record IDs to every model explanation.
- **G5 (P0):** Prevent the agent from inventing alternatives or making clinical recommendations.
- **G6 (P1):** Add local mock mode if API access or network connectivity fails.

### Epic H — Interface and demo readiness

- **H1 (P0):** Build navigation across all six main pages.
- **H2 (P0):** Build finding detail view with evidence, assumptions, and review controls.
- **H3 (P0):** Add loading, error, empty, and “demo data” states.
- **H4 (P0):** Prepare a short end-to-end demo narrative.
- **H5 (P1):** Add keyboard navigation, readable contrast, and labels for status icons.

### Epic I — Future validation and deployment

- **I1 (P2):** Review the workflow with hospital pharmacists and pharmacy-informatics staff.
- **I2 (P2):** Ask incumbent vendors whether they already provide policy-specific simulations and post-rollout verification.
- **I3 (P2):** Explore secure, read-only system integrations with a health-system partner.
- **I4 (P2):** Review privacy, security, governance, and deployment requirements with a health-system partner.
- **I5 (P2):** Evaluate false positives, missed issues, review time, and staff trust using approved evaluation data.

## 12. Hackathon sprint plan

**Assumption:** roughly 24 hours of build time. These are short build cycles; adjust the time boxes to the event. Each sprint ends with a working increment.

### Sprint 1 — Foundation and shared data (about 3 hours)

**Goal:** Everyone can run the app and load one consistent fictional scenario.

**Backlog:** A1–A4; start H1.

**Instructions:**

1. Create the repository structure and setup instructions.
2. Agree on shared schemas before splitting work.
3. Seed fictional data, including one intentional mismatch and several mock events.
4. Add “Load demo data” and a basic dashboard shell.
5. Do not use real medication or patient details in the demo.

**Done when:** A builder can start the app and see the demo scenario.

### Sprint 2 — Policy intake and rollout review (about 4 hours)

**Goal:** A user can provide an approved sample policy and inspect a reviewable draft plus system mismatches.

**Backlog:** B1–B4, C1–C3, G1, G3, G5.

**Instructions:**

1. Build the policy input screen.
2. Add one model call that extracts candidate rules into a schema.
3. Display source text beside each extracted rule.
4. Require confirmation before other features use the policy.
5. Compare confirmed rules with mock records using application code.
6. Make every mismatch explainable and reviewable.

**Done when:** The demo policy produces one confirmed rule and at least one evidence-backed mismatch.

### Sprint 3 — Flight Simulator and Ripple Map (about 5 hours)

**Goal:** A user can preflight a policy and see how an approved alternative could shift supply pressure.

**Backlog:** D1–D4, E1–E4, G2.

**Instructions:**

1. Create sample order scenarios. The model may draft cases; validate all fields before use.
2. Run cases through deterministic policy checks.
3. Show expected behavior, observed behavior, and any mismatch.
4. Build the Ripple Map from mock alternative links and inventory values.
5. Put the formula and assumptions next to projected values.
6. Do not ask the model to calculate inventory totals or select a medication.

**Done when:** A user can run at least three sample cases and see a ripple projection with its inputs.

### Sprint 4 — Shadow Mode and demo (about 4 hours)

**Goal:** A user can see how read-only event monitoring identifies a repeated unexpected pattern.

**Backlog:** F1–F5, H2–H4, G4, G6.

**Instructions:**

1. Load the fictional event stream when the user opens Shadow Mode.
2. Compare events with confirmed policy conditions using application code.
3. Group repeated deviations and show representative event records.
4. Label Shadow Mode read-only; do not imply that it changes orders or configurations.
5. Use the model to explain a finding only after deterministic checks produce it.
6. Rehearse: policy intake → rollout mismatch → simulation → ripple map → Shadow Mode finding.
7. Keep a mock response available if API access fails during the presentation.

**Done when:** The full demo works with fictional data and requires no live hospital connection.

## 13. Builder working instructions

- Use one shared schema and fixture dataset.
- Build a working vertical slice before polishing secondary screens.
- Keep model calls on the backend; never expose the API key in browser code.
- Treat model output as a draft until validated and confirmed by a human.
- Use application code for calculations, comparisons, thresholds, and graph building.
- Give every finding an evidence reference and a plain-language reason.
- Do not implement production write actions.
- Maintain a mock mode so the demo works without external services.

## 14. Proposed file map

```text
shortage-rollout-checker/
├── README.md
├── .env.example
├── frontend/
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── App.tsx
│       │   └── routes.tsx
│       ├── pages/
│       │   ├── OverviewPage.tsx
│       │   ├── PolicySetupPage.tsx
│       │   ├── RolloutReviewPage.tsx
│       │   ├── FlightSimulatorPage.tsx
│       │   ├── RippleMapPage.tsx
│       │   └── ShadowModePage.tsx
│       ├── components/
│       │   ├── FindingCard.tsx
│       │   ├── EvidencePanel.tsx
│       │   ├── StatusBadge.tsx
│       │   └── Navigation.tsx
│       ├── api/client.ts
│       ├── types/index.ts
│       └── styles/global.css
├── backend/
│   ├── pyproject.toml
│   └── app/
│       ├── main.py
│       ├── api/
│       │   ├── policies.py
│       │   ├── rollout.py
│       │   ├── simulator.py
│       │   ├── ripple.py
│       │   └── shadow.py
│       ├── schemas/
│       │   ├── policy.py
│       │   ├── medication.py
│       │   ├── scenario.py
│       │   └── finding.py
│       ├── services/
│       │   ├── policy_parser.py
│       │   ├── rollout_checker.py
│       │   ├── flight_simulator.py
│       │   ├── ripple_engine.py
│       │   ├── shadow_analyzer.py
│       │   └── audit_log.py
│       ├── ai/
│       │   ├── client.py
│       │   ├── prompts.py
│       │   └── tools.py
│       └── data/
│           ├── seed_demo.py
│           └── fixtures/
│               ├── policy.json
│               ├── configurations.json
│               ├── inventory.json
│               ├── alternatives.json
│               └── events.json
└── docs/
    ├── product-scope.md
    ├── data-dictionary.md
    └── demo-script.md
```

### Suggested stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Python, FastAPI, Pydantic
- **Demo storage:** JSON fixtures or SQLite
- **AI:** OpenAI Responses API, `gpt-5.5`, function calling, Structured Outputs
- **Visualization:** simple React graph or node-link component for the Ripple Map

This is a proposed stack, not a requirement. Keep the API model name configurable and use the framework the team can build with fastest.

## 15. Demo narrative

1. Load a fictional hospital and a shortage policy.
2. Confirm the policy rules extracted by the agent.
3. Open Rollout Review and inspect the outdated mock instruction.
4. Run the Flight Simulator and see which sample order reveals the mismatch.
5. Open the Ripple Map and show the projected effect of increased alternative use.
6. Open Shadow Mode and see a repeated post-rollout workaround in the mock event stream.
7. State clearly that findings are evidence for staff review; the app does not make clinical choices or change live systems.

## 16. Success criteria for the prototype

- The user can complete the demo without developer assistance.
- Extracted policy rules require human confirmation.
- Each finding shows its rule and supporting mock record.
- Simulation and Ripple Map results are reproducible from visible inputs.
- Shadow Mode is visibly read-only.
- The app works with fictional data and has a mock fallback.
- The team can state the proposed market distinction without claiming it is proven.

## 17. Research references

- [ASHP Guidelines on Managing Drug Product Shortages](https://academic.oup.com/ajhp/article/75/21/1742/5160014)
- [Bluesight ShortageCheck](https://bluesight.com/drug-shortage-software/)
- [Quva BrightStream Shortage Navigator](https://onequva.com/brightstream/shortage-navigator)
- [Merative OrbitalRX with Micromedex](https://www.merative.com/clinical-decision-support/pharmacy-inventory-management)
- [OpenAI API models](https://developers.openai.com/api/docs/models)
- [OpenAI Responses API function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

