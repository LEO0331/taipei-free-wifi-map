# Policy #8 v1.1 implementation plan

Base: b6422424c3d8e6b98a3aaa13701f0d0c1e517c14. PR #4 and #5 merged. Baseline init.sh: 27 tests and production build pass.

1. Preserve all raw hashes and both v1.0 immutable snapshots; add feat-007.
2. Pin offline Python GIS dependencies (PROJ/GEOS/pyshp), verify archives/CRS/DBF and topology without silent repair. Emit versioned geographic geometry and point audits.
3. Audit all B/C/D rows with edition-specific composite identity and explicit CRS assumptions. Reject unresolved rows individually, retain all audit records. Precompute hotspot/facility spatial joins and distances offline.
4. Implement typed deterministic Mode B scenarios, marginal and district/category representation, capacity/evidence/radius/interior/cohort sensitivity, self-count separation and source-backed exports.
5. Lazy-load bilingual Mode B within existing dashboard; Leaflet map and accessible table. Preserve Mode A and Mode C gate.
6. Test geometry/parser/model/lineage/failure contracts, deterministic rebuilds, baseline regressions and browser desktop/mobile/languages. Record actual outputs and local measurements.
7. Document requirement-to-evidence matrix, reproduction and limitations; commit logical slices, open exactly one PR to main, review CI, never merge.
