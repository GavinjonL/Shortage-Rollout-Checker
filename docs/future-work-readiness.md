# Epic J readiness package

These activities require external participants, contracts, approvals, or approved non-fictional evaluation data. This document prepares the work; it does not claim that validation has occurred.

## J1 — Market distinction validation

### Current evidence

Public vendor materials show that existing products already cover related shortage-management capabilities:

- [Bluesight ShortageCheck](https://bluesight.com/drug-shortage-software/) describes prediction, inventory visibility, prioritization, and collaborative planning.
- [Quva BrightStream Shortage Navigator](https://onequva.com/brightstream/shortage-navigator) describes forecasting, EHR/dispensing/inventory data integration, workflows, and communication.
- [Merative OrbitalRX with Micromedex](https://www.merative.com/clinical-decision-support/pharmacy-inventory-management) describes shortage workflows, inventory/procurement visibility, communications, and alternatives content.

Therefore, the product claim is a **hypothesis**, not a proven market gap: a reviewable policy-implementation verification workflow may be differentiated only if vendor demos and pharmacist users confirm that evidence-linked preflight checks and post-rollout, read-only exception monitoring are not adequately supported.

### Validation protocol

1. Request a current demo from each vendor using the same fictional policy scenario.
2. Ask whether the product can: extract a policy into reviewable rules; compare confirmed rules with EHR/ADC/pump configuration; run deterministic preflight cases; and group post-rollout exceptions without writing to clinical systems.
3. Record only demonstrated behavior, integration prerequisites, audit/evidence capability, and commercial constraints.
4. Have two pharmacy stakeholders score parity, partial parity, or gap for each capability.
5. Update the market statement to match the evidence; do not claim a gap if parity is shown.

## J2 — Pharmacist and pharmacy-informatics workflow review

Recruit at least two hospital pharmacists and two pharmacy-informatics staff through an approved internal process. Use only the fictional demo.

Interview prompts:

1. Does the draft → pharmacist confirmation → deterministic check sequence match your shortage-policy workflow?
2. Which policy fields need to be mandatory before rollout review?
3. Is the source excerpt sufficient evidence for review? What evidence is missing?
4. Which systems should appear in the rollout checklist first?
5. What false-positive behavior would make the tool unusable?
6. What wording could be misread as a clinical recommendation?

Record role, date, scenario, observed task friction, direct feedback, and requested changes. Do not record patient data or identifiers.

## J3 — Secure, read-only integration discovery

Target architecture for a future health-system pilot:

```text
Hospital source systems → integration gateway → least-privilege read-only adapter
→ normalized evidence store → policy verification service → reviewer UI
```

Discovery checklist:

- Identify each data owner for EHR order sets, ADCs, smart pumps, inventory/procurement, and audit events.
- Use separate service identities for each source with explicit read-only scopes.
- Prefer scheduled extracts or approved read-only APIs before event streams.
- Define record IDs, freshness expectation, retention, and provenance for every field.
- Do not enable write endpoints, order changes, substitution, blocking, or automated notifications in an initial pilot.
- Require security, pharmacy informatics, and source-system owner approval before any connection.

## J4 — Privacy, security, governance, and deployment review

Before real data or deployment, complete a health-system security review covering:

- Data classification and minimum-necessary data flow; exclude PHI from the first pilot where possible.
- Authentication (SSO/MFA), role-based access, least privilege, service-account lifecycle, and access recertification.
- Encryption in transit and at rest, secrets management, audit logging, retention/deletion, backup, and incident response.
- AI governance: approved provider, data-use terms, data residency, prompt/data retention, model change management, and human-review policy.
- Clinical and operational governance: pharmacist ownership, false-positive escalation, change control, and no autonomous recommendations or writes.
- Deployment controls: environment separation, vulnerability management, monitoring, disaster recovery, and business-associate/legal review as applicable.

Required approvals: pharmacy leadership, informatics, security/privacy, legal/compliance, and affected source-system owners.

## J5 — Approved-data evaluation plan

Do not use this prototype’s fictional data to make production-performance claims. After approval, define a retrospective, de-identified evaluation set with adjudicated policy/configuration/event labels.

| Metric | Definition |
| --- | --- |
| Precision | Confirmed true findings ÷ all findings surfaced |
| Recall | Confirmed true findings surfaced ÷ all adjudicated true findings |
| Missed issues | Adjudicated true findings not surfaced, categorized by cause |
| Review time | Median time from draft/finding display to pharmacist disposition |
| Evidence usability | Reviewer rating that cited policy/configuration/event evidence was sufficient |
| Staff trust | Pre/post pilot survey on clarity, workload, and appropriate reliance |

Evaluation steps:

1. Pre-register success thresholds with pharmacy stakeholders.
2. Split cases into development and held-out evaluation sets.
3. Have two independent qualified reviewers adjudicate disagreement cases.
4. Report confidence intervals and error categories, not a single unsupported accuracy claim.
5. Measure whether reviewers override, reject, or correct model drafts; retain human confirmation as the control.
