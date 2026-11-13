# Policy #8 v1.1 delivery evidence

Branch `codex/wifi-allocation-geographic-v1-1`; base `b6422424c3d8e6b98a3aaa13701f0d0c1e517c14` (fetched main, includes merged PR #4 and #5). Review PR link will be recorded in the session handoff. This PR must remain open for human review, with no automatic merge.

The result is an operational static experimental GIS research view with a defensible negative optimization finding. It is not a deployment recommendation. The [18-section Traditional Chinese MVP](wifi-allocation-v1.1-decision-mvp.zh-TW.md), [source-validation report](wifi-allocation-v1.1-source-validation.md), [coordinate contract](wifi-allocation-v1.1-coordinate-contract.md), [methodology/reproduction commands](wifi-allocation-v1.1-methodology.md), and [source-derived results](evidence/geographic-v1.1/results.md) contain the full evidence and limitations.

## Actual findings and immutable baseline

- Original v1.0 snapshot SHA-256 `91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82` independently verified; original and localized content-addressed snapshots/pointer unchanged. Mode A candidates/tiers/selections retain existing regression protection. Explorer stays at 3,297 rows; raw A–E bytes unchanged.
- Twelve official historical polygons pass CRS, axes, index/attribute, ring, topology and round-trip checks. Eleven sub-1m² original pair overlaps are explicitly retained. No geometry repair. CRS EPSG:3826 → EPSG:4326 uses validated PROJ, not a custom projection; approximate operation accuracy 1m is separate from original positional uncertainty.
- Ninety-one facility rows: Verified0 / Assumption-tested87 / Unresolved4. Accepted B69/C9/D9. Three source/polygon district discrepancies plus one missing library district label are individually excluded. No accepted independent numeric positional controls or authoritative facility datum declaration was found.
- A has 64 district disagreements, 200 duplicated coordinate groups, 12 polygon exteriors; 3,229 rows pass pre-strict geographic admission. All rows remain in the audit, and repeated coordinates never establish extra physical installations.
- No facility composite collisions, shared addresses, cross-source shared addresses, conflicting composite coordinates, publisher row collisions or duplicate facility-coordinate groups were found. The cohort is within-edition record composites, not verified unique physical sites.
- Combined R=C=87 has baseline geometric proximity 69/85/87 at 100/250/500m. Capacities5/10 produce zero increments in these descriptive lists. All produces 18/2/0, exclusively own-reference contribution. There is no nontrivial modeled geographic gain, so optimization conclusions are explicitly unavailable. Capacity5 strategy membership is identical; capacity10 shares five IDs and changes five in either direction; all shares 87 members.
- Verified-only correctly has zero candidates/references. All 288 sensitivity configurations are published, including exact ordered IDs, denominators, exclusions and representation changes. Strict/flagged variants do not change this edition's reference findings at supported thresholds. All claims depend on unconfirmed facility CRS hypotheses.
- Mode C still requires current operational/usage/quality evidence, identity continuity, comparable periods and a validated population/demand denominator. Geometry cannot establish any of them.

## Requirement-to-evidence matrix

| requirement | implementation / evidence |
|---|---|
| Latest main, merged PR4, scoped ledger/plan | base above; feat-007; `wifi-allocation-v1.1-plan.md` |
| Immutable v1.0 / explorer / Mode A | original SHA above; `wifiGeographic.test.ts`, existing 27 regression tests; no policy-v1 source edits |
| Accepted official editions and raw hashes | hardcoded `ACCEPTED_HASHES`/`ACCEPTED_FILES`; actual-results source table; original acquisition manifest |
| Safe ZIP/SHP/SHX/DBF/CPG/PRJ ingestion | `buildWifiGeographic.py`; raw ring, component-stem/index/code validation; geographic Python tests |
| Valid projection and independent control qualification | PROJ operation report, EPSG false-origin control, round-trip tests; no claim of surveyed facility controls |
| Polygon / multipolygon / hole topology | source validity and synthetic SHP multipart+hole test; no repair; measured overlap report |
| PIP, shared edges, invalid/exterior/multi-match | `spatial`, real Beitou/Shilin shared-edge regression, explicit 1mm numerical and 10/25/50m research flags |
| Per-source coordinate hypotheses and alternative interpretations | complete coordinate audit; B/D4326, C3826; C3825 rejection / C3828 operation unavailable |
| Identity, duplicates, evidence tiers and exclusions | coordinate contract; deterministic composite keys and collision diagnostics; 0/87/4 actual counts |
| Separate H/R/C contract and proximity | offline nearest/neighbor associations; independent spherical unit-vector/atan2 checks; threshold tests |
| Self-count / trivial / identical-neighborhood gate | own/other/total columns, `optimizationAvailable:false`, synthetic recalculation/set/identical-neighborhood tests |
| Two deterministic strategies and 5/10/all | `wifiGeographicScenarios.ts`; source-derived results; exact 288 scenarios |
| Sensitivity memberships/denominators/representation | UI comparisons plus content-addressed scenario payload/differences |
| Bilingual lazy static UI, Leaflet map and table | `WifiGeographicDashboard`; browser screenshots/request logs; marker-click, overlay/error recovery checks |
| Source-backed safe JSON/CSV exports | actual downloaded exports; immutable lineage, scenario/snapshot binding, CSV formula-injection tests |
| Mode C gated, no deployment claims | existing operational gate, explicit experimental warnings and unavailable metrics |
| Deterministic publication and failed-build safety | immutable directory / atomic manifest, failure-pointer regression, `data:verify:geographic`, final hash tests |
| Portable build/reproduction | pinned Python3.14 tooling, npm lockfile unchanged, init.sh and Pages offline-source workflow |
| Security/dependency review | package audits and license inventory; native read-only review, no material blocker |
| Human review only | one branch/PR to main; no auto-merge configuration or merge operation |

## Verification and local measurements

Executed command evidence is retained in `docs/evidence/geographic-v1.1/verification.log`, with GIS build log, `measurements.json`, package audits, browser request checkpoints, screenshots and actual downloads. Available static analysis is both TypeScript configurations in `npm run build`; no lint command is configured. A lint pass is not invented.

Browser QA covers 1280×900 desktop and 390×844 mobile, both languages, empty verified cohort, source cohorts, capacities, strategies, radii, boundary/circle controls, real map marker and table facility selection, Mode A return, Mode C gate and actual JSON/CSV downloads. Page content stays within viewport; large tables scroll locally. Optional boundary failure was induced only in `dist`, then restored; the scenario remained usable and retry recovered. No console warnings/errors were observed in the final browser session. The existing design is light-only, with no theme switch or dark media palette; dark-specific product behavior is not claimed.

Actual same-origin request logs show zero policy/GIS requests on initial explorer entry, Mode A JS/CSS/snapshot on policy entry, Mode B JS/CSS/manifest/snapshot only on Mode B entry, and boundary geometry only on explicit overlay request. These are local browser/server observations, not proof about all external traffic or public-host latency. Existing OpenStreetMap tiles remain an external dependency. A stale-index symptom during iterative local rebuilds exposed the existing cache-first navigation behavior; navigation is now network-first with offline fallback, while all policy manifests/artifacts continue to bypass the service worker. PWA cache version is advanced.

`measurements.json` records exact payload/gzip sizes and 100 local warmed scenario runs on Node24.14.1/Windows. Incremental lazy Mode B JS is approximately 32kB (about 11.5kB gzip); actual final build output is in the verification log. Geometry is 437,741 bytes / 140,735 gzip and is optional. The snapshot is 158,672 bytes / 17,567 gzip; exact current values and SHA-256 are in the manifest and measurement report. The complete 288-scenario summary is a separate research download, never an initial browser request. Local scenario timing is well below 1ms in the retained run, excluding network/device/public-host effects.

## Change inventory and review

New implementation: offline GIS builder, scenario builder, reproducibility verifier, local measurement/report/verification-server utilities; geographic types, validation/exports, scenarios, lazy dashboard/CSS; Python and TypeScript tests. Existing edits: dashboard Mode B integration with Mode A controls preserved, service-worker version/navigation caching, package commands, init.sh, Pages workflow, byte-preserving Git attributes, ignored local virtual environments, ledger, READMEs/progress/handoff. New artifacts live exclusively under `public/data/wifi-policy/geographic-v1.1`; original raw and v1.0 files remain unchanged. No npm dependencies, backend, Google Maps JS or portfolio changes.

Five bounded native reviews covered GIS admission, model/exports, UI, test/reproduction adequacy, and security/dependencies. Corrections include raw-ring validation before Shapely auto-closure, ODS repeat overflow rejection, pinned source identities, shared-boundary tolerance, invalid projection handling, publisher/coordinate collision diagnostics, source-safe URLs, set-based gains, snapshot/version binding, identical-neighborhood gating, overlay-only retry and map click/viewport behavior. Final claims rely on executed tests rather than review alone.

Simplifications: standard-library ODS/ZIP parsing uses the retained fixed schema; existing Leaflet and policy card/control patterns are reused; all GIS stays offline; no new browser geospatial dependency or ranking weights. Original-data refresh remains an explicit separate admission action. The previous v1.0 documents remain historical evidence.

Remaining limits: assumed B/C/D datum/accuracy, no independent surveyed controls, historical boundaries with disclosed microscopic overlaps, within-edition composite identity, unknown current operation/access/feasibility/cost and no resident demand denominator. The native-library advisory surface is not exhaustively proven safe by Python package advisories. Stable or empty geometric results cannot establish actual digital-inclusion policy priorities.

For a future Portfolio Case Study008 update: use the official-source → CRS → spatial admission → self-count diagnosis evidence chain, 0/87/4 tier matrix, source/polygon discrepancies, immutable provenance, capacity10 membership comparison and responsive research screenshots. Describe the negative optimization finding honestly; do not claim Wi-Fi coverage, equipment recommendations or people served. No portfolio update is performed here.
