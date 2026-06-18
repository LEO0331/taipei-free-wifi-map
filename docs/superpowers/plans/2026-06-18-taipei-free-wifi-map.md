# Taipei Free Wi-Fi Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a bilingual, static Taipei Free Wi-Fi exploration app backed by reproducible local data conversion.

**Architecture:** Pure TypeScript utilities normalize and query hotspot data. Node scripts generate static JSON. React owns view and filter state; an imperative Leaflet boundary owns marker clustering.

**Tech Stack:** Vite, React, TypeScript, Leaflet, Leaflet MarkerCluster, CSS, Node test runner via tsx.

---

### Task 1: Project and data contracts

**Files:** `package.json`, `tsconfig*.json`, `vite.config.ts`, `src/types.ts`

- [ ] Add only the runtime/build dependencies required by the specification.
- [ ] Define the hotspot, summary, filter, language, and report types exactly once.
- [ ] Run `npm install` and verify TypeScript can resolve the project.

### Task 2: Data utilities using TDD

**Files:** `src/lib/wifi.ts`, `src/lib/csv.ts`, `tests/wifi.test.ts`, `tests/csv.test.ts`

- [ ] Write failing tests for BOM CSV parsing, quoted values, coordinate status, area normalization, category mapping, filtering, Haversine distance, language distance formatting, Google Maps URLs, and summary counts.
- [ ] Run `npm test` and confirm failures are caused by missing implementations.
- [ ] Implement the minimum pure functions required by the tests.
- [ ] Run `npm test` and confirm all utility tests pass.

### Task 3: Fetch and conversion scripts

**Files:** `scripts/fetchWifiHotspots.ts`, `scripts/convertWifiHotspots.ts`, `scripts/buildWifiSummary.ts`

- [ ] Implement conditional official CSV download with `--force`, metadata recording, and an existing-file fallback.
- [ ] Implement CSV-to-hotspot conversion with optional input path, validation, report generation, and static JSON output.
- [ ] Implement summary regeneration from converted hotspot JSON.
- [ ] Run fetch and conversion; inspect total, invalid, and outside-Taipei counts.

### Task 4: React application

**Files:** `src/main.tsx`, `src/App.tsx`, `src/components/*`, `src/styles.css`

- [ ] Add a data loader and bilingual translations with Chinese fallback.
- [ ] Add sticky identity header, language toggle, five section tabs, disclaimer, and footer.
- [ ] Add global search/select/checkbox filters shared by map, nearby, directory, and overview.
- [ ] Add clustered Leaflet markers, category icons, bilingual popups, map recentering, and user marker.
- [ ] Add geolocation, radius selection, distance sorting, denied-location messaging, and Google Maps links.
- [ ] Add paginated directory cards and dependency-free summary charts.
- [ ] Verify keyboard focus, labels, contrast, and reduced-motion behavior.

### Task 5: PWA, docs, and deployment

**Files:** `index.html`, `public/manifest.webmanifest`, `public/sw.js`, `public/icons/*`, `README.md`, `.github/workflows/deploy-pages.yml`

- [ ] Add viewport, metadata, manifest, theme color, icon placeholders, and service-worker registration.
- [ ] Cache the app shell and generated data with a base-path-safe service worker.
- [ ] Document purpose, source, conversion, field handling, limitations, commands, and deployment.
- [ ] Add the requested GitHub Pages workflow and repository base path.

### Task 6: Verification

- [ ] Run `npm run data:fetch`.
- [ ] Run `npm run data:convert`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Serve the production build and verify mobile/desktop map, filters, language toggle, directory, overview, notes, manifest, and service worker.
- [ ] Review the final diff against every acceptance criterion and fix gaps.

