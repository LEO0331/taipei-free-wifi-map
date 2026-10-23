# Policy workflows: customer-facing guidance

2026-10-23 · feat-008 · local implementation on `codex/wifi-policy-customer-guidance`

## Problem and change

Mode B v1.1 already provides experimental geographic scenarios, but Mode A's footer still displayed a v1.0 B-unavailable panel. The interface also used A/B/C for analytical modes, review tiers and source codes without enough distinction. Users had to translate methodological warnings into a practical next step.

The new guide presents three questions and their deliverables:

| Mode | User question | Current status |
| --- | --- | --- |
| A · 熱點資料查核 | Which records should be checked first? | Review controls and source-backed exports available |
| B · 公共設施現勘規劃 | Which facilities warrant a site visit? | Experimental distance, map and shortlist exploration available |
| C · 服務與近用驗證 | How can actual service and access be verified? | Fieldwork guidance available; outcome assessment awaits evidence |

Each mode explains what users get, their next step and the result's limits. B adds a sentence computed from the current scenario's eligible count, baseline count and distance. An empty publisher-verified cohort explains the evidence gap and how to inspect assumption-tested scenarios. C provides site/access checks, repeatable connection observations, and voluntary de-identified demand/barrier research, with conditions for future outcome assessment.

The obsolete B gate is removed. A's original assumptions remain expandable under “如何解讀查核結果”; its retained source audit is explicitly historical to that edition. Neither the snapshot nor exports are rewritten to claim new evidence.

## Changed files

- `src/components/WifiPolicyGuide.tsx`: bilingual mode navigation, purposes, outputs, boundaries and C workflow.
- `src/components/WifiPolicyDashboard.tsx`: guide integration, retired gates/selector removal, readable A limitations and edition-scoped source audit.
- `src/components/WifiPolicyDashboard.css`: selected/focus states, guide layout and narrow-screen stacking.
- `src/components/WifiGeographicDashboard.tsx`: B titles, metric labels, dynamic interpretation and next steps.
- `feature_list.json`, `progress.md`, this document and `docs/evidence/policy-guidance/`: status and review evidence.

## Verification

- Full `init.sh`: npm ci, conversion of 3,297 retained records, 8 Python GIS tests, 37 Node tests, byte-identical geographic generation and all 288 scenario hashes, TypeScript/Vite build.
- Final text adjustments: TypeScript/Vite build passed again. No lint script is configured.
- Production browser: Chinese and English navigation and C guidance; B default 100m shows 69/87 and 18 remaining, 250m shows 85/87 and 2 remaining; publisher-verified-only cohort shows zero with explanation. A capacity 10 survives A → C → A. No captured console warnings/errors.
- Visual review 94/100 at observed 714px viewport; see screenshots and verdict in `docs/evidence/policy-guidance/`. Narrow layout is implemented in CSS but no new device-emulated mobile check was performed.
- `git diff --check` passed. No new dependencies or analytical algorithms. Existing regression tests cover deterministic identities, selections, evidence gates and exports.

The initial final harness attempt encountered a Windows native-module lock from the running preview server. Stopping that server and rerunning the full harness resolved it. An old service-worker-cached HTML page on port 4173 was avoided with a fresh preview origin.

## Remaining limits and useful next work

Authoritative original facility coordinates, current opening/access conditions, comparable operational observations and validated demand populations remain missing. Fieldwork instructions do not constitute a measurement system. A future scoped feature could provide a downloadable fieldwork template and import validation, after agreeing on measurement fields and privacy handling. Actual outcome scores must wait for reviewed observations and defined comparison baselines.

This change is local and has not been published.
