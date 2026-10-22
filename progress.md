# Session Progress Log

## 2026-10-22 — Policy #8 verified delivery

- Feature `feat-005`: implemented and verified; creating the requested review PR is the remaining delivery step.
- Branch `codex/wifi-allocation-decision-support`, freshly fetched base `99f304a017bafda95130052ee3ea1efed4bd5290`.
- Official A–G audit and original bytes retained. A current 3,305 rows versus legacy 3,297; 19 added, 11 absent, 33 numerical coordinate changes. These are source-publication observations, not equipment events.
- Mode A: 3,316 inspectable source-row candidates, tiers A63/B57/C3196; strict default 3,293 eligible. Capacities 5/10/all, evidence-first/category balancing, filters, strict/broader and legacy sensitivity, bilingual lazy dashboard and real JSON/CSV exports work.
- Mode B deliberately unavailable: facility CRS/precision/identity contract incomplete; Mode C unavailable without operations/demand evidence. Downloaded facility files remain auditable.
- Verification: Git Bash `./init.sh` passed npm ci (0 vulnerabilities), retained 3,297-row conversion, **23/23 tests**, TypeScript/Vite build. Actual new policy `--refresh` downloads succeeded; two retained rebuilds yielded identical snapshot ID/hash/bytes. Final bilingual metadata explanation also passed build.
- Snapshot `wifi-policy-c250791e7736ed5bca2882ea`, 1,707,558 bytes, SHA-256 `91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82`.
- Production browser: desktop/mobile no page overflow; zero initial policy requests; all capacity/strategy/gate controls, real export downloads, language switch, pagination, explorer search/filter retention and overview verified. No browser warnings/errors. Geolocation permission was not granted.
- Windows native build-module lock resolved by stopping development servers before npm ci. Raw-byte Git attributes prevent newline conversion. Timestamp-only explorer verification output restored.
- Full changed-file inventory, timings, hashes, source IDs, tests, limitations and future Case Study 008 material: `docs/wifi-allocation-delivery.md`. No portfolio modifications or added dependencies.

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
