# Facility coordinate and identity contract

Every original row remains in `coordinate-audit.json`, including source filename/hash, publisher row number, original record/name/address, original coordinate field/value strings, declared CRS (null), explicit assumed CRS, transformed longitude/latitude, original administrative label and its derivation basis, polygon attribution/status/distance, evidence tier/confidence, eligibility and reasons. No numeric confidence percentage is used. `independentPositionEvidence: []` honestly records the absence of independent numeric positional validation; the official identity references in the [source-validation report](wifi-allocation-v1.1-source-validation.md) are not relabeled as position evidence.

| source | retained edition | coordinate hypothesis | examined | verified | assumption-tested | unresolved |
|---|---|---|---:|---:|---:|---:|
| B libraries | 2026-06-10 | published 經度/緯度 interpreted as EPSG:4326 | 70 | 0 | 69 | 1 |
| C activity centers | 2025-12-18 | 座標X/座標Y interpreted as EPSG:3826, then PROJ to EPSG:4326 | 9 | 0 | 9 | 0 |
| D sports centers | 2026-03-02 | published 經度/緯度 interpreted as EPSG:4326 | 12 | 0 | 9 | 3 |

Verified requires authoritative source CRS evidence, validated transformation, qualified identity and geometry. Passing geometric/administrative tests alone cannot establish this tier. Assumption-tested requires a stated plausible coordinate hypothesis, reproducible conversion, valid unique within-edition composite, explicit district agreement and unique interior/boundary-adjacent attribution. Independent numeric comparisons are applied only where available; none were established for this edition. Unresolved rows cannot contribute to modeled gains.

B/D districts are parsed from the published address (`sourceDistrictBasis: parsed-published-address`), not claimed to be a separately published district column. C uses its explicit `區別`. These source fields are not independent controls. The 士林分館 address lacks an explicit 區 district token; the pipeline does not invent one from the facility name. Its polygon says 士林區, but it stays unresolved until its administrative contract is reviewed. The D records 中山運動中心, 南港運動中心, 中正運動中心 geometrically match 大同區, 信義區, 大安區 respectively, contradicting their source addresses. Their original coordinates remain intact, with investigation rather than correction required.

## Activity-center hypothesis

All nine actual ODS rows pass the same EPSG:3826 candidate transformation and agree with their explicit source districts. The first retained original row is 萬華新移民會館: X `300625.00599999999` (display text 300625.006), Y `2770374.449`. Machine values are preserved rather than invented from the illustrative task example. The ODS parser honors repeated rows/cells, rejects populated overflow beyond the seven-field schema, missing columns, nonpositive repetition and unsafe XML declarations, and bounds expansion. Numeric values use ODS machine values; text cells retain published wording.

All nine also receive alternative-interpretation diagnostics: EPSG:3825 (zone119) transforms far outside Taipei and is not admitted; EPSG:3828 has no accepted non-ballpark offline operation in the pinned PROJ setup and is recorded as unavailable, with no homemade conversion substituted. This does not prove that the original publisher meant EPSG:3826. The chosen hypothesis remains contingent on publisher clarification; even district agreement for nine rows is not a datum declaration.

## Identity and duplicate grain

Keys use `source ID + edition SHA prefix + SHA-256(name/address composite)`. The source edition hash is retained in full. This is a unique **within-edition facility composite**, not a permanent publisher ID, verified distinct physical location or longitudinal facility identity. C `編號` is retained as a publisher row label, not promoted to permanent identity. Source-row collisions, exact composite duplicates, conflicting composite coordinates, shared addresses, publisher row collisions, cross-source shared addresses and duplicate coordinate groups are audited. Conflicting/duplicate identities are excluded individually, with deterministic source-row disambiguation for their audit keys.

This edition has no duplicate composites, conflicting composite coordinates, shared addresses, publisher row collisions, cross-source shared addresses or facility duplicate-coordinate groups. A's 200 duplicate hotspot-coordinate groups are separately reported. No fuzzy cross-source or longitudinal deduplication is performed. Colocated distinct records would remain distinct research records with a warning in diagnostics; they would never become a claim about multiple physical installations. Synthetic tests verify retained colocation and set-based gain counting.

Original coordinate accuracy, surveyed entrance positions, operating hours, current operation, public accessibility and equipment suitability remain unknown for every admitted facility.
