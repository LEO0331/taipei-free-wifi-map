# Session Handoff

## 2026-10-22 — Policy #8 v1.1 geographic research

- Implemented feat-007 in isolated branch `codex/wifi-allocation-geographic-v1-1`, based on fetched main `b6422424c3d8e6b98a3aaa13701f0d0c1e517c14`; PR4/5 merged. Human-review PR creation is the remaining delivery step; never auto-merge.
- Original raw bytes and v1.0 snapshot SHA256 `91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82` preserved; original explorer3297 and Mode A3316/tier63-57-3196 unchanged.
- Twelve official historical polygons validated via pinned offline PROJ/GEOS/pyshp. Facility tiers0 verified /87 assumption-tested /4 unresolved; B69 C9 D9 admitted,3 district disagreements plus1 missing district excluded.
- Geographic generation `wifi-geo-da9f69f501af4d6e1d3f9122`; snapshot SHA256 `0f6a44f9df4139b060fa2b6d906380c0600e1d95aaa72cd4da03aed2926b3d8f`; boundary SHA256 `de9fcacdd831d0d5c608bf3f8e5de2559c0a03cffa2014faf94bf92617899a1c`.
- All288 scenarios published; combined baseline69/85/87 at100/250/500m. No non-self increment: optimization unavailable. All87 produces only18/2/0 self contributions; capacity5/10 descriptive lists produce0. Verified-only denominator0 is intentional.
- Final init.sh passes npm ci, explorer conversion,8 Python GIS tests, byte-identical geographic/scenario rebuild,37 Node tests and TypeScript/Vite build. Required retained policy fetch/audit/build also pass. No configured lint command; no invented lint result.
- Final production desktop1280x900/mobile390x844 bilingual checks, source/detail/map overlays/marker clicks, empty cohort, Mode C gate, actual JSON/CSV downloads and optional boundary404/retry pass. No page overflow or console warnings/errors. Existing light-only theme retained.
- No new npm dependency; Python3.14 GIS tools exactly pinned, npm/Python audits zero known vulnerabilities. Full docs, actual IDs/counts/lineage, local measurements and five bounded native reviews in `docs/wifi-allocation-v1.1-delivery.md` and `docs/evidence/geographic-v1.1/`.
- Remaining limits: unconfirmed facility datum/accuracy, no independent surveyed controls/current operation/access/demand/cost evidence; historical overlaps disclosed. No Wi-Fi service or installation benefit claimed. No portfolio changes.

Startup: Python3.14 + Node22+, then Git Bash `./init.sh`. `npm run data:verify:geographic` compares rebuilt manifest/scenario pointers before/after; full commands in v1.1 methodology. Source refresh remains explicit and separate.


## Latest follow-up — policy localization

- Review PR [#5](https://github.com/LEO0331/taipei-free-wifi-map/pull/5) is open and not merged. Implementation commit `ac22822`.

- `feat-006` completes the user's Chinese/English consistency request on `codex/wifi-policy-localization`, based on main `fc3fe9340c460418b4255d04cf8a0150dbcf669b`. Original PR #4 was already merged; this follow-up uses a separate review PR. Do not merge automatically.
- Both languages cover all policy prose and source metadata. Candidate names/districts/categories now use edition-matched official English fields; original identifiers and optional raw codes remain traceable.
- Current snapshot `wifi-policy-e08d28277549c88787dea209`; hash `cd675db75af4b65220692dc59916c7e5b88920b42613d4b82c7affcb43e0dfaa`. This adds display fields without changing source editions, candidate IDs or selections. Earlier delivery records below describe the original snapshot.
- Full `./init.sh` passes **27 tests**, TypeScript/Vite build and original converter. Browser desktop/mobile Chinese/English checks pass, no console errors; 24 scenario regression configurations preserve selected IDs. See `docs/wifi-policy-localization.md` for evidence and the explicit publisher-wording exception.
- PWA cache now `taipei-wifi-v4-policy-locale-1`. No dependencies added; original explorer data preserved.


## Policy #8 handoff — 2026-10-22

- Goal: complete the explicitly permitted Mode A evidence-readiness MVP, preserve original explorer and open one review PR; do not merge.
- Current branch: `codex/wifi-allocation-decision-support`; base `99f304a017bafda95130052ee3ea1efed4bd5290`.
- Code, source audit, 18-section Chinese MVP, methodology and delivery evidence are complete. Review PR [#4](https://github.com/LEO0331/taipei-free-wifi-map/pull/4) is open and not merged. Main implementation commit: `dec5ffabb4d1c8c71f26647e0d69c5f56e7f1896`.
- Run `./init.sh` (on this Windows host use installed Git Bash), then `npm run data:audit:wifi-policy` and `npm run data:build:wifi-policy`. Stop Vite servers before npm ci on Windows to avoid native-module file locks.
- Latest full verification: 23/23 tests; TypeScript and production Vite build pass; current policy 3,305 rows, legacy 3,297; immutable snapshot `wifi-policy-c250791e7736ed5bca2882ea`, SHA-256 `91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82`.
- Browser production checks passed Chinese/English, 390px mobile/1280px desktop, capacities, sensitivity, gates, actual downloads and explorer regressions. No console warnings/errors. Nearby geolocation permission remains untested; pure distance tests pass.
- Mode B is unavailable pending official facility coordinate/identity admission and audited polygon transform. Mode C is unavailable pending site-level operations/demand evidence. These gates are intended accepted fallback behavior, not fabricated completed geographic models.
- `npm run data:fetch:wifi-policy -- --refresh` stages pending original bytes without promoting accepted editions; repeat builds never rewrite acquisition dates. `.gitattributes` protects original-byte hashes across operating systems.
- Explorer still uses the old retained raw source. Do not silently migrate it or equate record changes with installations/removals. See the explicit migration procedure in methodology.
- Evidence, exact results, changed files, local measurements and limitations: `docs/wifi-allocation-delivery.md` and `docs/evidence/`.

Historical initial-product handoff follows unchanged.

## Current Objective

- Goal: Deliver and verify the initial Taipei Free Wi-Fi Map scope.
- Current status: Complete and reviewed.
- Branch / commit: Current workspace; commit not created.

## Completed This Session

- [x] Static data pipeline and 3,297-record output
- [x] Bilingual map, nearby finder, directory, dashboard, notes, PWA
- [x] Code-review fixes and anti-slop cleanup
- [x] Minimal agent harness

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Data | `npm run data:convert` | PASS | 3,297 records; 12 outside Taipei |
| Tests | `npm test` | PASS | 14/14 |
| Build | `npm run build` | PASS | TypeScript and Vite production build |
| Security | `npm audit --omit=dev` | PASS | 0 vulnerabilities |
| Browser | In-app desktop/mobile QA | PASS | No console warnings or errors |

## Files Changed

- See `git status --short`; changes span the application, scripts, tests, docs, generated data, and harness.

## Decisions Made

- Keep the app static and dependency-light.
- Keep outside-Taipei records; default to Taipei City only.
- Use network-first caching for generated data and do not cache cross-origin map tiles.

## Blockers / Risks

- Geolocation requires user permission and was covered by pure distance tests rather than granting browser location access.

## Next Session Startup

1. Read `AGENTS.md`.
2. Read `feature_list.json` and `progress.md`.
3. Review this handoff.
4. Run `./init.sh` or the documented verification command before editing.

## Recommended Next Step

- Create a new feature entry only when new scope is requested.
