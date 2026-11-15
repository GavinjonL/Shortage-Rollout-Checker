# Compare two policies across every feature

In Overview, click Reset once to restore the baseline records and clear follow-up cases. In Policy Setup select Sample A and click Load sample, then Create draft. This still calls your configured Groq API; loading a sample does not create findings or confirm rules. Review and confirm the extracted rule. Visit all four feature pages. Return to Policy Setup, select Sample B and repeat. Loading the second sample clears the first confirmation.

| Feature | Sample A: Emergency shortage | Sample B: Infusion reserve |
| --- | --- | --- |
| Rollout Review | One possible mismatch: ehr-demo-001 permits routine use. Cabinet restriction wording is present. | Zero mismatch findings; pump-demo-001 explicitly Needs clarification because its instruction is generic. |
| Flight Simulator | Three baseline cases: Pass, Possible mismatch, Needs clarification. | No matching sample cases. This is an empty state, not a passed simulation. |
| Ripple Map | At 30% shift, med-b-oral use is 13 units/day and supply above reserve is 60/13 = 4.6 days. | No projection because no alternative is approved. |
| Shadow Mode | One repeated-event finding for med-a-iv in dept-emergency. | No matching repeated-event findings for med-c-reserve in dept-infusion. |

Both use the same baseline dataset. The sample selector stores text and expected outcomes only; the ordinary extraction, confirmation and comparison services produce actual results. The expandable expectations panel in Policy Setup is a reference checklist, not a generated report. Imported records, edited simulator instructions or follow-up cases can change these expectations.

Sample A must extract medication med-a-iv, department dept-emergency, alternative med-b-oral and effective date 2026-11-15. Sample B must extract medication med-c-reserve, department dept-infusion, no alternative and effective date 2026-11-15. Review any model ambiguities; correct a missing field before confirming. Do not confirm invented extra rules.

Text files: sample-policy-contrast-a.txt and sample-policy-contrast-b.txt. The app reads the same source text from backend/app/data/fixtures/policy_samples.json.

For live verification, from backend run `.venv/Scripts/python.exe scripts/verify_policy_contrast.py`. It makes two provider requests, then checks all four features in an isolated process without changing the running server. Actual results and provider response IDs are saved in policy-contrast-results.json. Offline regression tests also check both workflows without consuming provider credits.
