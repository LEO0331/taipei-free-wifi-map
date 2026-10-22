# Session Progress Log

## 2026-10-22 — Policy tab language consistency

- Review PR [#5](https://github.com/LEO0331/taipei-free-wifi-map/pull/5) is open and not merged; localization implementation commit `ac22822`.

- Completed `feat-006` on branch `codex/wifi-policy-localization`, based on main `fc3fe9340c460418b4255d04cf8a0150dbcf669b`. PR #4 was already merged before this follow-up, so a separate localization review PR is used. Chinese explanations, source metadata, gates, exclusions, assumptions and limitations now stay in Chinese; English candidate names/districts/categories use the publisher's same-edition English columns.
- Raw issue codes are behind a localized disclosure. IDs, hashes and standard file/coordinate notation remain original; missing official translations fall back transparently. One official English name contains `(一)` and is preserved as published.
- Added a focused locale helper and coverage tests instead of duplicating source snapshots per language. Display-label enrichment leaves all candidate IDs, counts, tiers and 24 scenario selections unchanged.
- Active snapshot `wifi-policy-e08d28277549c88787dea209`, SHA-256 `cd675db75af4b65220692dc59916c7e5b88920b42613d4b82c7affcb43e0dfaa`, 2,154,132 bytes (227,849 gzip). Raw source hashes remain unchanged; previous snapshot retained for audit.
- Final `./init.sh`: npm ci (0 vulnerabilities), original 3,297-row conversion, **27/27 tests**, TypeScript/Vite build pass. Repeated policy rebuilds are byte-identical. PWA cache version advanced for the updated UI.
- Production browser: both languages inspected through source metadata and expanded diagnostics, B/C gates checked, Datong filter remains 206 eligible across switching, no unexpected Chinese in the default English panel, no mobile page overflow or console warnings/errors. Evidence and screenshots: `docs/evidence/localization/`; follow-up report: `docs/wifi-policy-localization.md`.


## 2026-10-22 — Policy #8 verified delivery

- Feature `feat-005`: completed as the permitted Mode A MVP. Review PR [#4](https://github.com/LEO0331/taipei-free-wifi-map/pull/4) is open and not merged.
- Branch `codex/wifi-allocation-decision-support`, freshly fetched base `99f304a017bafda95130052ee3ea1efed4bd5290`.
- Official A–G audit and original bytes retained. A current 3,305 rows versus legacy 3,297; 19 added, 11 absent, 33 numerical coordinate changes. These are source-publication observations, not equipment events.
- Mode A: 3,316 inspectable source-row candidates, tiers A63/B57/C3196; strict default 3,293 eligible. Capacities 5/10/all, evidence-first/category balancing, filters, strict/broader and legacy sensitivity, bilingual lazy dashboard and real JSON/CSV exports work.
- Mode B deliberately unavailable: facility CRS/precision/identity contract incomplete; Mode C unavailable without operations/demand evidence. Downloaded facility files remain auditable.
- Verification: Git Bash `./init.sh` passed npm ci (0 vulnerabilities), retained 3,297-row conversion, **23/23 tests**, TypeScript/Vite build. Actual new policy `--refresh` downloads succeeded; two retained rebuilds yielded identical snapshot ID/hash/bytes. Final bilingual metadata explanation also passed build.
- Snapshot `wifi-policy-c250791e7736ed5bca2882ea`, 1,707,558 bytes, SHA-256 `91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82`.
- Production browser: desktop/mobile no page overflow; zero initial policy requests; all capacity/strategy/gate controls, real export downloads, language switch, pagination, explorer search/filter retention and overview verified. No browser warnings/errors. Geolocation permission was not granted.
- Windows native build-module lock resolved by stopping development servers before npm ci. Raw-byte Git attributes prevent newline conversion. Timestamp-only explorer verification output restored.
- Full changed-file inventory, timings, hashes, source IDs, tests, limitations and future Case Study 008 material: `docs/wifi-allocation-delivery.md`. No portfolio modifications or added dependencies.
- Main implementation commit: `dec5ffabb4d1c8c71f26647e0d69c5f56e7f1896`. The GitHub connector returned 403 for PR creation; the repository's existing Git credential successfully created exactly one PR through GitHub API. No merge performed.

Historical session record follows unchanged.

## Current State

**Last Updated:** 2026-09-01
**Active Feature:** None — initial product scope complete

## Status

### What's Done

- [x] Split the project documentation into English (`README.md`) and Traditional Chinese (`README-zh.md`) versions
- [x] Converted the provided 3,297-record CSV into static JSON
- [x] Built the bilingual map, nearby finder, directory, dashboard, notes, and PWA assets
- [x] Fixed code-review findings and removed generated JavaScript/declaration artifacts
- [x] Added the repository harness and restart workflow

### What's In Progress

- [x] No active implementation

### What's Next

1. Run `./init.sh` before new work.
2. Add a new feature entry before expanding scope.

## Blockers / Risks

- [ ] Browser geolocation still depends on user permission and device accuracy.
- [ ] OpenStreetMap tiles and Google Fonts require network access.

## Decisions Made

- **Static-only architecture**: Browser reads generated JSON; scripts own external data access.
- **Dependency-light dashboard**: CSS/SVG-style charts avoid a charting package.
- **Taipei-only default**: Outside-Taipei records remain available when the filter is disabled.

## Files Modified This Session

- `src/` - application, map, filters, dashboard, and utilities
- `scripts/` - fetch, conversion, and summary generation
- `public/` - generated data and PWA assets
- `tests/` - parser, conversion, filtering, distance, summary, and localization checks

## Evidence of Completion

- [x] Tests pass: `npm test` — 14/14
- [x] Type check/build clean: `npm run build`
- [x] Data conversion: `npm run data:convert` — 3,297 records
- [x] Manual verification: desktop/mobile map, language, search, dashboard, outside-Taipei filter

## Notes for Next Session

Do not restore generated `.js` or `.d.ts` files beside TypeScript sources. The build uses `--noEmit`.
