# Policy #8 delivery and engineering evidence

Follow-up: [policy-tab localization](wifi-policy-localization.md) adds complete language-specific display text and edition-matched official English candidate fields. Its active snapshot and verification supersede the initial display payload figures below; source editions and investigation selections are unchanged.

Delivered the task's explicitly permitted **Mode A evidence-readiness MVP**. Mode B is unavailable with audited facility/CRS reasons, and Mode C is unavailable without operational and demand evidence. This is an independent investigation-support POC, not a deployment plan. No dependencies were added. The original explorer edition and behavior are preserved.

Branch: `codex/wifi-allocation-decision-support`. Base: `99f304a017bafda95130052ee3ea1efed4bd5290`, confirmed by `git fetch origin main` on 2026-10-22. Exactly one review PR [#4](https://github.com/LEO0331/taipei-free-wifi-map/pull/4) is open against `main`; main implementation commit is `dec5ffabb4d1c8c71f26647e0d69c5f56e7f1896`. The GitHub connector lacked PR-write permission (403); the repository's existing Git authentication successfully created it through GitHub API. No merge is requested or performed.

## Sources, editions and reconciliation

The [source audit](wifi-allocation-source-audit.md) records publishers, catalogue/resource URLs, identifiers, schema, missingness, units, licenses, coordinate semantics and exclusions. [Acquisition manifest](../data/raw/wifi-policy/acquisition-manifest.json) retains byte counts and SHA-256 for original resources and HTML evidence. All downloads remain separate from explorer inputs.

| Source | Verified resource ID | Actual retained records | Eligibility |
| --- | --- | ---: | --- |
| A Wi-Fi | `549b3a9b-eb6c-4cb1-848b-8c238735e2db` | 3,305 | Inventory evidence review |
| B libraries | `fb6cc268-e2b8-43a7-86f2-e79702291a2b` | 70 | Facility coordinate/identity contract incomplete |
| C activity centers | `5ae02e14-50fc-4906-86a7-96e0231780e1` | 9 | Projected X/Y CRS unresolved; ODS not ingested into production |
| D sports centers | `e7c46724-3517-4ce5-844f-5a4404897b7d` | 12 | Facility coordinate/identity contract incomplete |
| E boundaries | `d8b7eb29-136f-49fc-b14b-3489d3656122` | 12 polygons | TWD97 TM121 verified in PRJ; transform/join not validated |
| F citywide statistics | Official time-series URL in manifest | 28 annual rows | Context only, 1998–2025; no site allocation of totals |
| G operating guidance | Three official DOIT URLs in audit | 3 HTML documents | Hours/obstruction cautions; no measured service data |

A is the catalogue's 2026-07-01 15:32:22 resource. Original audit retrieval is known to day (2026-10-22); exact completion timestamps remain null. A separate successful scripted refresh at 06:23:02–06:23:03 UTC retained the same A–E byte hashes with precise acquisition times in `data/raw/wifi-policy/refresh/`. It did not promote or mutate the accepted acquisition manifest. Legacy acquisition/publication time remains unknown; filename and filesystem mtime are not substituted.

| Audit | Retained legacy | Current A |
| --- | ---: | ---: |
| Raw rows / unique SITE_ID / unique HOTSPOT_ID | 3,297 each | 3,305 each |
| Missing IDs / duplicate IDs / invalid numeric geographic coordinates | 0 / 0 / 0 | 0 / 0 / 0 |
| Source-labelled Taipei | 3,285 | 3,293 |
| Source-labelled outside Taipei | 12 | 12 |

Exact unique site+hotspot pairs: 3,286 shared, 19 current-only, 11 legacy-only, 33 numerical coordinate changes, 1 category change, 75 other metadata changes, 0 ambiguous current matches. There are 596 coordinate string differences; numeric comparison avoids treating formatting differences as location changes. Differences overlap and are publication changes, not proof of equipment installation/removal. Full district, category and agency/vendor distributions and changed identities are retained in the snapshot and [reconciliation observations](../data/raw/wifi-policy/reconciliation-observations.json).

| Bytes | SHA-256 |
| --- | --- |
| Legacy A | `c230610998a33309677fa235ec11b05d047bf3c9379dc6a7683ff3645a422c15` |
| Current A | `09c150e7b8a75e1477413ddcc37059fe97b3c2353ac9f8799069e65d8f81cc55` |
| B | `82f4e1aedafd3b68a9b6adc619fdd5e00e4871c3c94100201eefdb12070e0847` |
| C | `368778b0c649f24b05cc0383172afb0e1b804c332541e2d33a2117d7d83834a0` |
| D | `23c5ce0906358d8f95b2f1a8e1b019487cd7fa564b2cf188681648d23c89b11c` |
| E | `77bcc347b503b8ff8a43f7e1afaaedb18877a6222282587b145adaba69afd2d9` |
| F | `35abcf8bf6c068d512ebb854028b59635a6defd8404afd1c84970ee1f9137100` |
| Published policy snapshot | `91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82` |

Snapshot ID: `wifi-policy-c250791e7736ed5bca2882ea`. `.gitattributes` disables text newline conversion for retained raw bytes and policy snapshots so Windows/Linux checkouts preserve hash evidence.

## Actual investigation results

Method `wifi-allocation-evidence-review-v1` uses first-matching A/B/C evidence tiers and lexical ID tie-breaking. Candidate grain is source SHA-256 + encoded SITE_ID + HOTSPOT_ID + canonical-row hash prefix + exact-duplicate occurrence. Unique pairs establish source correspondence, not unique physical sites. No name joins or guessed coordinates are used. Every current row plus legacy-only rows is inspectable: **3,316 candidates**, A **63**, B **57**, C **3,196**. C means routine boundary/operational verification, not a detected malfunction. Metadata differences become B unless a primary A issue takes precedence.

Strict default eligibility requires a unique pair, published Taipei administrative labels, and current-source membership. Broader eligibility admits inspectable uncertain/outside rows solely for investigation; stale inclusion is separate. Filters precede selection. Mode A intentionally allows coordinate problems to enter evidence review rather than pretending they are validated map points.

| Capacity, strict current only | Evidence selected | Balanced selected | Categories, evidence / balanced | Shared selected IDs |
| --- | ---: | ---: | --- | ---: |
| 5 | 5 | 5 | 3 / 5 | 1 |
| 10 | 10 | 10 | 3 / 10 | 2 |
| All | 3,293 | 3,293 | 13 / 13 | 3,293 |

Balanced review round-robins published facility categories, not inferred geographic need. At capacity 5 it represents 3 source districts versus 2 for evidence-first; at 10 it represents 6 versus 2. At unlimited capacity membership is equivalent while order differs. This is documentation representation, not socioeconomic equity.

Default first five actual site/hotspot IDs are `TPEE002338`, `TPEE002354`, `TPEE002595`, `TPEE002596`, `TPEE002597`; each has a changed-coordinate verification question. Example: 北市聯醫中興院區8F民眾休息區中央 has complete candidate ID `A:09c150e7b8a75e1477413ddcc37059fe97b3c2353ac9f8799069e65d8f81cc55:TPEE002338:TPEE002338:7496992a426ee77b:1`. Balanced first five are `TPEE000752`, `TPEE002596`, `TPEE000046`, `TPEE002887`, `TPEE004335`. Full source-edition-bound IDs, configuration and actual rows are in [sample JSON](evidence/sample-decision.json), [sample CSV](evidence/sample-decision.csv) and dashboard exports.

Sensitivity populations: strict/current 3,293; broader/current 3,305; strict including legacy-only 3,304; broader including legacy-only 3,316. Evidence-first top five remain unchanged for these settings. Geographic threshold sensitivity and proximity gains are unavailable while Mode B is gated. Source-edition mismatches throw instead of silently comparing incomparable scenarios.

## Implementation and requirement evidence

| Requirement | Implemented evidence |
| --- | --- |
| Repository/source audit | Fetched baseline, source audit, original resource/catalogue/guidance bytes and manifest |
| Independent reproducible ETL | `fetchWifiPolicySources.ts`, `auditWifiPolicySources.ts`, `buildWifiPolicySnapshot.ts`; explicit pending refresh, original-byte verification, lexical ordering, immutable edition + atomic current pointer |
| Identity/data governance | Strict CSV/UTF-8/schema validation, exact pair reconciliation, duplicate occurrence keys, edition-specific diagnostics, outside rows retained |
| Mode A scenarios | Pure `wifiPolicyScenarios.ts`; capacities, two strategies, filters, sensitivity and exclusions |
| Mode B/C gates | Typed eligibility reasons and bilingual UI; no synthetic geographic or outcome results |
| Lazy bilingual UI | Independent React lazy component + CSS; 20 candidates per page; complete IDs rendered only on explicit disclosure |
| Safe exports | JSON/CSV actual candidates, source URLs/hash/editions, config, assumptions, exclusions, unknowns; formula prefix protection; CSV governance metadata once, avoiding quadratic export size |
| Static hosting/PWA | BASE_URL policy fetch, unchanged Pages base/Leaflet; cache version changed; policy JSON not precached or silently served stale; only app-owned old caches removed |
| Cross-platform provenance | `.gitattributes` byte preservation; no changing retrieval timestamp during rebuild |
| Engineering evidence | 23 passing Node tests, TypeScript/Vite build, repeated byte-identical snapshots, browser/log/screenshot and local measurement artifacts |
| Continuity | Feature tracker, bilingual README, 18-section Chinese MVP, methodology, progress and handoff |

Added files: `.gitattributes`; `scripts/{fetchWifiPolicySources,auditWifiPolicySources,buildWifiPolicySnapshot,measureWifiPolicy}.ts`; `src/types/wifiPolicy.ts`; `src/lib/{wifiPolicy,wifiPolicyScenarios}.ts`; `src/components/WifiPolicyDashboard.{tsx,css}`; `tests/wifiPolicy.test.ts`; `data/raw/wifi-policy/`; `public/data/wifi-policy/`; four allocation documents and `docs/evidence/` artifacts. Updated files: `src/App.tsx`, `src/components/Layout.tsx`, `src/translations.ts`, `public/sw.js`, `package.json`, deployment workflow, both READMEs, `feature_list.json`, `progress.md`, `session-handoff.md`. No original explorer application/data transformations were changed. Timestamp-only conversion output from verification was restored to baseline.

Simplifications: static source evidence instead of backend services; category round-robin instead of unjustified weights; gated geographic/outcome models instead of fabricated results; reuse existing test runner, CSS variables and localization pattern. No broad application refactor.

## Verification actually executed

On Windows, the default `bash` points at WSL and was unavailable in the sandbox. The required `./init.sh` was executed using installed Git Bash. A later `npm ci` initially encountered a Windows native-module file lock from the development servers; stopping those servers and rerunning completed successfully.

| Check | Actual result |
| --- | --- |
| `npm ci` via `./init.sh` | 33 packages installed; audit 0 vulnerabilities |
| `npm run data:convert` via `./init.sh` | 3,297 records, 3,297 broad-bounds-valid, 12 outside; explorer edition unchanged |
| `npm test` | **23/23 pass**, no failures; [exact output](evidence/verification.log) |
| `npm run build` | Both TypeScript checks and Vite production build pass, 34 modules |
| Policy fetch, retained/default | Hash verification successful; no network mutation |
| Policy fetch `--refresh` | Actual A–E HTTPS downloads successful, identical bytes retained separately with exact timestamps |
| Policy audit | Current 3,305, no missing/duplicate IDs, all 16 accepted resource/evidence/legacy hashes verified |
| Two repeated policy builds | Same ID, SHA-256 and 1,707,558 bytes both times |
| `git diff --check` | Pass |
| Browser production build | Chinese/English, 5/10/all, pagination, strategies, strict/broader/stale, B/C gates, real JSON/CSV downloads, no warnings/errors |
| Desktop/mobile | 1280×900 and 390×844; no page overflow; candidate/comparison/audit tables scroll within containers |
| Explorer regression | Clustered map, 48 directory cards, original 3,297/3,285/12 overview, notes, nearby controls; 新店 search 12 results preserved across policy entry |
| Initial payload isolation | Server request log records **zero** policy module/data requests before tab entry |

Tests cover BOM/reordered/malformed/empty CSV, UTF-8 failure, required/duplicate headers, ID collisions/missing IDs, numeric coordinate formatting, projected CRS rejection, source scope semantics, legacy-only duplicate diagnostics, tiers/capacities/empty populations/balancing/sensitivity, same/different edition comparisons, formula injection/export size, allowlist and failed/oversized/empty fetches, nested output schemas, immutable publication failure preserving last-good content, and real retained-source hashes. Geographic greedy/threshold/polygon tests are not claimed because that production mode is unavailable. No lint command is configured; TypeScript checks and tests are the available static/behavior checks.

[Browser observations](evidence/browser-checks.json), [initial requests](evidence/initial-production-requests.jsonl), [after-entry requests](evidence/production-requests.jsonl), and screenshots document the manual checks. Browser location permission was not granted; nearby distance behavior remains covered by existing pure tests. Visual comparison against the existing explorer style passed 94/100; there was no external mockup. Final screenshots use the final snapshot.

## Payload and local performance

The snapshot is **1,707,558 bytes**, **162,570 bytes gzip**. There are two identical published copies (content-addressed edition and current pointer); only the current pointer is requested by the UI. Lazy policy JS is **28,424 bytes**, policy CSS **3,511 bytes**; main JS **399,196 bytes**, base CSS **27,807 bytes**. Policy source HTML/raw files are outside `public/` and are not browser payloads.

`npm run data:measure:wifi-policy` records 100 warmed pure-function runs for each of 12 capacity/strategy/eligibility configurations on Node v24.14.0/Windows. In the retained measurement, medians span **0.163–1.543 ms**, p95 values span **0.178–2.536 ms**. Exporting all 3,316 broader+stale rows produces **1,577,805 CSV bytes** in **7.588 ms** locally. Actual browser default CSV is 13,198 bytes with governance metadata occurring once. These measurements exclude host/network/device variability and do not establish public-host latency. Exact values and selected IDs are in [measurement report](evidence/policy-measurements.json); rerunning intentionally updates measurement time/timings, not source editions or policy outputs.

## Remaining evidence and future Case Study 008 material

Mode B needs an accepted facility identity, official coordinate datum/precision, verified spatial attribution and reference population. The retained library/sports composite keys are unique in their snapshots but do not establish longitudinal identity. ODS conversion and TWD97 polygon transformation remain deliberately outside v1. Mode C needs real site-level operational, quality and demand/population evidence with comparable periods. No candidate implies operational harm or installation suitability; opening hours, accessibility, obstructions, power, mounting permissions, backhaul and costs require separate verification.

Useful material for a future Case Study 008: source admission/rejection matrix, numerical versus textual coordinate reconciliation, immutable source lineage, investigation-tier examples, strategy shortlist overlap, sensitivity stability, lazy request evidence and responsive screenshots. This task does not create or modify a portfolio repository or case study.
