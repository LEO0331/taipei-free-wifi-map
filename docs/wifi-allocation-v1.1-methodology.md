# Policy #8 v1.1: geographic evidence and experimental proximity

Method: `wifi-geographic-proximity-experiment-v1`. The research question is which eligible official facility records warrant further field investigation under limited review capacity, given published hotspot locations and explicit coordinate assumptions. Slots represent investigation capacity. They do not authorize installation or imply that a selected facility is technically suitable.

## Relationship to the preserved baseline

Mode A retains `wifi-allocation-evidence-review-v1`, its ranking, eligibility controls, reconciliation and exports. Its historical snapshot is `wifi-policy-c250791e7736ed5bca2882ea` with SHA-256 `91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82`. Localization has a separate derived snapshot; it does not redefine the historical results. The original explorer retains 3,297 rows. Mode B uses independent artifacts under `public/data/wifi-policy/geographic-v1.1/`. Mode C remains unavailable.

## Sources and reproducibility

The accepted retained editions are A (Wi-Fi, 2026-07-01), B (libraries, 2026-06-10), C (activity centers, 2025-12-18), D (sports centers, 2026-03-02), and E (district boundaries, 2024-09-16). Original bytes and their hashes remain unchanged. Publication dates identify editions; they are not guarantees of current operation or current geometry. See [source validation](wifi-allocation-v1.1-source-validation.md) and [coordinate contracts](wifi-allocation-v1.1-coordinate-contract.md) for source-specific evidence and exclusions.

The frontend stays TypeScript/React/Leaflet. Offline GIS uses Python 3.12, pyproj 3.7.2, Shapely 2.1.2 and pyshp 2.3.1, with transitive NumPy/certifi versions also pinned in `requirements-geographic.txt`. No Python runtime or GIS dependency enters the browser. Install the pinned build tools, then run the retained-source workflow:

```bash
python -m pip install -r requirements-geographic.txt
npm ci
npm run data:convert
npm run data:fetch:wifi-policy
npm run data:audit:wifi-policy
npm run data:build:wifi-policy
npm run data:build:wifi-geographic
npm test
npm run build
git diff --check
./init.sh
```

Use a Python 3.12 interpreter for the first command; the geographic Node wrappers require the supported runtime. They use `GEOGRAPHIC_PYTHON` when set, otherwise `.omx/geographic-venv` when available, otherwise the platform Python command. Install dependencies into that same interpreter. Fetch defaults to retained-byte validation. A live refresh is a separate acceptance process, never a GitHub Pages build prerequisite. Failed input validation must abort publication. Deterministic sorted serialization and content identities support repeated-build comparison; acquisition dates must not be regenerated as processing timestamps.

## Official district geometry

The E ZIP hash is verified before parsing. Archive paths and SHP/SHX/DBF/CPG/PRJ components are checked. The actual PRJ declares TWD97 / TM2 zone 121, matched to EPSG:3826. Transformation uses PROJ through pyproj with `always_xy`: input easting/northing in metres, output longitude/latitude in degrees, EPSG:4326. RFC 7946 serialization preserves polygon parts and interior rings with explicit ring orientation. Unsupported or contradictory CRS metadata and invalid geometry are rejected; repairs cannot be silent.

The retained source yielded twelve valid district polygons, zero rejected polygons and no repairs. The source contains only single-part polygons without holes; synthetic tests exercise multipart and hole handling rather than pretending the real edition contains them. DBF `TNAME` supplies district names; `CPTID`, `PNAME` and `PTNAME` cross-check source identities, and original administrative attributes remain in the audit. Eleven polygon pairs have tiny source overlaps, approximately 0.00001029–0.4074735 m², preserved rather than repaired. Individual geometry validity does not establish a nonoverlapping partition; multi-match points remain ambiguous. The selected operation is `Inverse of Taiwan 2-degree TM zone 121 + TWD97 to WGS 84 (1) + axis order change (2D)` with a stated operation accuracy of 1 metre. That number concerns the transformation operation, not the original boundary or facility positional accuracy. PROJ network access and ballpark operations are disabled.

The analytical projection-origin fixture, `(250000, 0) → (121°, 0°)`, checks projection and axis convention. Round-trip tolerance is 0.001 m. Neither an analytical fixture nor a round trip independently establishes surveyed positional truth. No independently surveyed local control point is claimed. Exact measured error, software versions, component hashes and geometry identity are in `boundary-validation.json`; results describe the historical E edition.

## Spatial attribution and evidence tiers

Offline point-in-polygon analysis records source district separately from polygon district, all matching polygons, interior/boundary/exterior/ambiguous/invalid status, nearest boundary distance and agreement. A shared boundary is never assigned arbitrarily. Source/polygon disagreement is an investigation finding, not proof that a published coordinate is inaccurate.

B and D are evaluated under an EPSG:4326 assumption. C is evaluated under an EPSG:3826 hypothesis with the same validated transform as E. An established CRS for E does not establish C's CRS. All rows are checked, including invalid and excluded rows. Numerical plausibility and polygon agreement are derived checks; they are not independent publisher datum confirmation.

`verified` requires authoritative source CRS evidence plus valid transformation, geometry and identity. `assumption-tested` records carry explicit unconfirmed CRS assumptions and pass the documented reproducible checks. `unresolved` records fail an essential condition and cannot contribute to modeled gains. No numeric confidence score is invented. None of these tiers certifies entrance-level accuracy, public access, current operation or installation suitability.

The strict geographic setting excludes points within the chosen 10/25/50 m boundary tolerance and unresolved district attribution. The flagged setting may retain qualifying interior or uniquely matched boundary-adjacent records with warnings. The tolerances are research exclusions/sensitivity parameters, not measured error guarantees. Exact implementation rules and record-level findings remain inspectable in the coordinate report.

## Facility identity and model population

The reference unit is an official source-edition facility record with a collision-tested within-edition identity, not a verified distinct physical public site. For sources without trustworthy stable IDs, a normalized name/address composite supplies a deterministic research key scoped to the raw-source hash. Missing identities, duplicate composites, conflicting coordinates and possible colocation remain audit findings. Similar names across datasets do not authorize deduplication or longitudinal identity claims.

Each scenario derives both C (candidate records) and R (reference records) from the same evidence, geographic and source-category filter; therefore C = R. Equal reference weight is an explicit research assumption. H is the set of eligible published hotspot coordinate locations, with colocated hotspot rows collapsed as coordinate locations while original identifiers remain traceable. A hotspot location does not establish an active physical installation.

Distance associations and nearest eligible hotspots are computed offline. For threshold r, baseline reference proximity is the set `B = {q ∈ R : ∃ h ∈ H, d(q,h) ≤ r}`. The threshold is inclusive. It is geometric proximity, never wireless coverage. For selected S, candidate c adds `G(c,S) = {q ∈ R : d(q,c) ≤ r} ∖ (B ∪ ⋃s∈S G(s,∅))`. Each distinct reference ID is counted once. Source records at the same physical place can remain distinct denominator units when cross-source physical identity is unresolved; exports disclose that limitation.

## Strategies, self-reference and capacity

Marginal Reference Proximity recomputes additional uncounted reference associations after each selection, uses deterministic ID tie-breaking and separates candidate-self contribution from other-reference contribution. Since C = R, selecting a baseline-nonproximate record necessarily associates that record with itself at distance zero. This arithmetic cannot independently justify prioritization. If no additional non-self relationship exists, or all references are already baseline-proximate, the output is a descriptive selection with optimization unavailable, not a claim of meaningful improvement.

Geographic / Facility Representation prioritizes the district with the fewest selected records, then additional non-self marginal associations and stable ID. This administrative representation objective remains distinct from whether meaningful geometric gains are available. Categories are reported as outcomes; the procedure does not independently balance categories. Representation concerns source geography, not demographics, equity or demand. The source population is small and selective; balanced records are not representative samples of residents.

Capacity 5/10/all takes at most the eligible count. All means all eligible investigation records. Strategy comparisons publish exact ordered IDs, shared/added/removed membership, denominator, baseline proximity, incremental associations, non-self contributions and district/category representation. Stable membership is a valid sensitivity result; it is not proof of policy priority.

## Sensitivity and interpretation

Compare verified-only against verified plus assumption-tested evidence; 100/250/500 m; strict against flagged geometry; 10/25/50 m boundary tolerance; B/C/D/combined facility cohorts; capacity 5/10/all; and both strategies. Verified-only can legitimately yield an empty cohort. A change in cohort changes both C and R, so raw gains across cohorts do not measure equal demand. Any eligible C record depends on its explicit CRS hypothesis unless authoritative evidence independently establishes it.

The UI labels hypothetical circles immediately as “Hypothetical geometric research radius” / 「假設性幾何研究半徑」. English and Traditional Chinese controls and explanations use the selected language. Official Chinese facility names may remain where no authoritative English equivalent exists; they are source labels, not untranslated application instructions. Map markers are bounded and equivalent candidate information is available in an accessible table.

## Audit, exports and unavailable outcomes

Versioned artifacts separate geometry, source/coordinate audit, reference index, exclusions, snapshot, scenario summaries and lineage. JSON and CSV include source hashes/editions, original rows and coordinate fields, declared versus assumed CRS, geometry and method versions, eligibility, exact selections, exclusions, assumptions, self/non-self contributions and unavailable metrics. CSV cells guard formula-prefix injection. An export is research evidence, never municipal installation authorization.

No result establishes radio propagation, connection quality, resident service, demand, digital exclusion, operational cost, power, backhaul, mounting rights or deployment feasibility. Mode C requires operational and quality observations, comparable usage and time windows, continuous site identity and defensible population/demand denominators. Actual source-derived results, selection IDs, runtime/payload measurements and executed verification are recorded in the [Traditional Chinese MVP](wifi-allocation-v1.1-decision-mvp.zh-TW.md) and [delivery report](wifi-allocation-v1.1-delivery.md). Planned checks must never be reported as executed evidence.
