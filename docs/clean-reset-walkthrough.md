# Clean-reset walkthrough

Run this checklist with the backend and frontend running locally. Use fictional data only.

| Step | Action | Expected visible result | Status |
| --- | --- | --- | --- |
| 1 | Select **Reset demo data** on Overview. | Demo status confirms the shared fictional fixture was reset. | Ready to rehearse |
| 2 | Select **Load demo data**. | Overview shows the fictional policy, finding queue, and demo-data label. | Ready to rehearse |
| 3 | Open Policy Setup and confirm every displayed rule. | The visible AI-mode label remains present; final confirmation activates the shared policy. | Ready to rehearse |
| 4 | Open Rollout Review. | Generated deterministic rollout finding appears; filters, review controls, CSV, and print controls work. | Ready to rehearse |
| 5 | Open Flight Simulator and run each sample case. | Each case returns expected/observed behavior and evidence. | Ready to rehearse |
| 6 | Open Ripple Map and change the shift. | Projection refreshes from shared inventory and confirmed policy data. | Ready to rehearse |
| 7 | Open Shadow Mode and save a review. | Read-only grouped finding, event evidence, and activity entry are visible. | Ready to rehearse |
| 8 | Open Activity History. | Policy confirmation and review actions appear in history. | Ready to rehearse |

## Recorded automated checks

- Frontend production build: `npm run build` — pass.
- Backend test suite: `26 passed` on the current branch, including `test_clean_reset_demo_walkthrough_uses_shared_fictional_data`.
- Manual browser walkthrough: record the date, tester, AI mode, and any failed button below.

| Date | Tester | AI mode | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-11-14 | Codex automated rehearsal | Mock | Pass | Mock extractor returned one labeled, reviewable fictional draft without credentials. |
| 2026-11-14 | User visual rehearsal | Mock | Pass | Reset, load, confirmation, rollout, simulation, ripple, shadow, and activity-history walkthrough passed. |
| 2026-11-14 | User visual rehearsal | Live Groq | Pass | Safe connectivity check passed; visible live Policy Setup draft flow passed. |
