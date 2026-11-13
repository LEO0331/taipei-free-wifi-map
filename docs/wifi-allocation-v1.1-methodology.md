# Experimental geographic proximity methodology

Method `wifi-geographic-proximity-experiment-v1`, schema `1.1`, Policy #8 v1.1. This extends v1.0 source-evidence review without changing its method, snapshot, ranking, source reconciliation or explorer edition. Mode B is an experimental public-facility field-review POC. Mode C remains unavailable without operational/usage evidence and a comparable population/demand denominator.

## Populations and geometry

H contains qualified published A coordinate locations: valid official identifiers, source-labelled Taipei, unique pair, accepted polygon interior or separately flagged boundary-adjacency, and source/polygon district agreement. Strict mode also excludes points within 10m of a boundary; flagged mode permits unique boundary-adjacent members while preserving their uncertainty. Outside, ambiguous and conflicting rows remain in the audit. Duplicate H coordinates have the same distance effect as one coordinate; no installation count is inferred.

R and C are the same accepted within-edition B/C/D composite cohort, filtered by verified-only versus verified plus assumption-tested, source cohort and geographic rule. This edition admits 87 records in the assumed combined population; zero qualify verified-only. Reference grain is a facility **record composite**, not a verified distinct physical site. No resident-demand weights or private residential geocoding are used.

Haversine distances use mean Earth radius 6,371,008.8m. All nearest-H distances (strict/flagged) and facility neighbor associations up to 500m are computed offline. React only filters small precomputed association lists and performs deterministic set-based selection; it does not run hotspot/facility pairwise calculations per render. Inclusive thresholds 100/250/500m are research parameters, not RF radii. Distances serialize to six decimals; 1mm numerical edge matching is separate from 10/25/50m research uncertainty flags. No tolerance is a measured source-accuracy guarantee.

Baseline reference proximity is `min distance(R,H) <= r`. At selection step S, the candidate association set excludes references already proximate to H or counted through earlier candidates. Every reference is counted at most once. Report candidate-own newly counted reference (0/1), additional distinct new references, their total, exact newly counted IDs, baseline IDs, denominator and ordered selected IDs.

## Strategies and the trivial-model gate

Marginal Reference Proximity recomputes the uncounted neighborhood at every step, maximizing its cardinality with lexical ID tie-breaking. Geographic/Facility Representation prioritizes the least-used `validated district | source category` group, then uses the same marginal/ID order. It balances groups; it does not guarantee equal marginal category totals, measure demographic equity or rank digital exclusion. This edition's capacity10 representation selection covers ten districts but one category; this limitation is reported, not hidden.

Optimization is available only if at least one uncounted reference is associated with a different candidate and uncovered neighborhoods provide a comparative distinction. Identical neighborhoods, all-baseline-proximate and self-only models disable optimization. When disabled, marginal strategy displays a descriptive lexical ID order with `descriptive-only` explanations; representation may still describe group diversity. Neither becomes an investment recommendation. Capacities 5/10/all use the actual eligible count; all never authorizes installation.

Actual source results at 100/250/500m have no non-self incremental associations to unproximate references. Optimization is therefore unavailable throughout this edition. Combined baseline counts are 69/85/87 out of 87. Capacities5/10 yield zero increment in both descriptive lists. All yields 18/2/0, entirely guaranteed self-contributions. The valid finding is a limitation of this particular facility/reference model, not a geographic deployment benefit.

## Sensitivity and provenance

The full matrix has 288 configurations: 2 evidence thresholds × 3 radii × 2 geographic rules × 4 cohorts × 3 capacities × 2 strategies. UI comparisons display added/removed/shared IDs and changes in denominator, baseline, modeled increment, districts and categories. Verified-only legitimately produces an empty denominator. Libraries/sports/activity cohorts have different meanings and sizes, not comparable demand weights. This edition's strict/flagged baseline and selection results are unchanged at the supported thresholds despite differing H boundary admission. Source assumptions still dominate evidentiary interpretation.

At capacity5 both strategies share all five IDs. At capacity10 they share five IDs, with five added/five removed. All shares the same 87 members, potentially different order. Exact IDs, names, counts and per-scenario representations are generated in [actual results](evidence/geographic-v1.1/results.md) and the content-addressed scenario payload. Stable membership across radii is descriptive, not validation of priorities.

Geographic version IDs derive from canonical JSON objects before inserting the version ID into the snapshot (`identitySchema: version-bound-v1`). Artifact hashes cover the final exact bytes. The manifest binds the snapshot version, file path/hash/size and tool versions. Immutable generation files publish first; the manifest pointer is atomically replaced last. Scenario summary files have their own content hash/pointer, tied to the same geographic version. Failed parsing/building cannot replace the last valid pointer. Old v1.0 snapshots are never written by the GIS builder.

Browser fetches validate path, byte count, SHA-256, schema, source linkage and snapshot version. Exports preserve original rows/coordinates, edition/hash, transformation, geometry edition, settings, exact ordered IDs, exclusions, unavailable metrics and responsible use. CSV protects formula-leading prefixes and quotes fields. Source labels are escaped, including Leaflet tooltip text. Optional boundary failures retain a usable scenario and overlay retry.

## Reproduction and dependencies

Supported runtime: Python 3.14, Node22+ and the existing npm lockfile. Python tools are build-time only: pyproj3.7.2/PROJ9.5.1 (projection), Shapely2.1.2/GEOS3.13.1 (topology/spatial checks), pyshp3.0.3 (SHP/SHX/DBF), NumPy2.5.4 (Shapely requirement), certifi2026.10.19 (pyproj requirement). All Python versions are pinned; no npm dependency is added. Registry wheels keep native GIS code out of the browser. See [licenses](evidence/geographic-v1.1/licenses.json), [Python audit](evidence/geographic-v1.1/python-audit.json), and [npm audit](evidence/geographic-v1.1/npm-audit.json). Audits found no known package vulnerabilities; they do not prove absence of bundled native-library vulnerabilities. PROJ is MIT; GEOS is LGPL-2.1-or-later; their bundled notices are retained by the installed distributions. pyproj/pyshp MIT, Shapely BSD, NumPy mixed BSD/permissive notices, certifi MPL-2.0.

A custom projection/SHP implementation was rejected because it would lack established validation. Node-only alternatives would require additional projection, topology and archive packages. Existing ODS ZIP/XML uses Python standard libraries with strict source/schema gates. No backend, browser Taipei API fetch or Google Maps JavaScript dependency is introduced.

```bash
npm ci
npm run data:convert
npm run data:fetch:wifi-policy
npm run data:audit:wifi-policy
npm run data:build:wifi-policy
npm run data:setup:geographic
npm run data:audit:geographic
npm run data:build:geographic
npm run data:verify:geographic
npm run data:report:geographic
npm run data:measure:geographic
npm test
npm run build
git diff --check
./init.sh
```

`data:setup:geographic` creates `.venv-gis` with the platform Python3.14 executable and installs pinned requirements. Windows uses installed Git Bash for `./init.sh`. Rebuilding GIS uses no network; setup may download trusted package-registry wheels. Measurements are explicit and separate from deterministic builds. Pages CI installs pinned tooling, validates retained bytes/reproducibility and builds committed artifacts without fetching live source editions. No public site latency or Wi-Fi performance is inferred from local measurements.
