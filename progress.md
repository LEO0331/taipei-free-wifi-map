# Session Progress Log

## Current State

**Last Updated:** 2026-06-18
**Active Feature:** None — initial product scope complete

## Status

### What's Done

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
