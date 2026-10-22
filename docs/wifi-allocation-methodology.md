# Policy #8: evidence review methodology

Method: `wifi-allocation-evidence-review-v1`. This independent research POC assigns **investigation slots** to inspectable official source records. It does not authorize equipment installation, removal or relocation. Its urgency tiers concern documentation evidence, not connectivity harm.

## Evidence contract

The retained explorer edition and the newly acquired policy edition are separate inputs. Source A is the official Taipei Free inventory, dataset `6aa6532d-652f-4c1b-814a-4646b75407af`, resource `549b3a9b-eb6c-4cb1-848b-8c238735e2db`. Catalogue publication, acquisition, processing and filesystem modification times have different meanings. Unknown legacy acquisition time remains null; mtime is never substituted for acquisition evidence. Raw byte hashes identify input editions. Rebuilding retained inputs must preserve source acquisition timestamps and yield the same policy snapshot bytes.

The source audit records original bytes, schemas, hashes, acquisition evidence and exclusions: [source audit](wifi-allocation-source-audit.md). A source-row count is not a unique physical-site count, access-point count, operating-network count or population denominator. Multiple hotspot identifiers can share a site. Name similarity never establishes identity.

## Mode A: inventory and evidence-quality review

Mode A is the production MVP. Candidate identity is `A:<source-byte SHA-256>:<encoded SITE_ID>:<encoded HOTSPOT_ID>:<canonical-row SHA-256 first 16 hex>:<occurrence>`. Canonical row fields are sorted by key; exact duplicate rows retain deterministic occurrence suffixes. Source edition in the key makes it a source-row identity, not a claim of physical-site continuity. Stable, unique site/hotspot pairs support reconciliation; duplicate or missing identifiers remain visible as evidence questions. The candidate table retains explicit issue codes, source edition, published district/category, coordinate fields and eligibility state.

Tier rules are first-matching: tier A if any of `ambiguous-source-identity`, `invalid-wgs84-coordinate`, `no-current-counterpart`, `changed-coordinates`, `new-source-relationship`, or `ambiguous-legacy-relationship` occurs; otherwise tier B if there is any issue other than `boundary-and-operation-unverified`; otherwise tier C. Documentation issue codes include duplicate site/hotspot IDs, outside/unresolved source scope, missing attribution, missing documentation, changed category and `source-metadata-changed`. Metadata changes describe published fields; they do not establish a physical change. Within a tier, candidate ID is the stable tie-breaker. No numeric risk weights are used. Tier C is an explicit boundary/operational verification question, not a finding of malfunction.

Strict eligibility requires a verified unique site/hotspot pair and published Taipei scope. Broader eligibility admits inspectable ambiguous or outside/unresolved-scope source rows for investigation; it does not certify their identity, coordinates or Taipei inclusion. Stale records require the separate inclusion switch. Category and district filters apply before selection. Exclusion reasons are counted with deterministic first-matching precedence; these counts describe filtering, not separate independent issue totals.

### Two capacity strategies

Evidence Gaps First sorts eligible candidates by tier A/B/C, then candidate ID. Balanced Facility Review groups by the official published facility category, sorts category names, and round-robins groups while retaining tier/ID order inside each group. It can therefore select a lower-urgency question to represent another category. The balanced objective is documentation representation, not fairness or an equity index. Source district fields may describe representation, but are not polygon verification.

Both strategies accept capacities 5, 10 and all eligible. Capacity used is `min(capacity, eligible count)`. All eligible means a review population, not permission to install equipment everywhere. Results include ordered selected IDs, exclusions, represented categories/districts, source editions, assumptions and unavailable metrics. Scenario comparisons require identical snapshot IDs. Compare selected membership as well as order; all-capacity strategies may contain identical members in different orders.

## Mode B: geographic facility review gate

Mode B remains unavailable in this release. Libraries and sports centers contain geographic-looking coordinate pairs, but authoritative CRS/precision and stable facility identity contracts are incomplete. Community-center X/Y fields are projected-looking values with unverified CRS. District polygons are TWD97 and have no validated transform in this implementation. A broad bounding box cannot establish Taipei membership. Downloading a resource does not make it eligible for geographic allocation.

If a future source contract passes, candidate grain must be official facility source plus verified facility ID (or a documented collision-tested composite). Let H be validated listed hotspot points, R eligible reference facilities, C candidate facilities, r an explicit research threshold, and S selected candidates. A deterministic greedy step would choose the candidate with the greatest number of distinct R points within r that are not already within r of H or S, resolving ties by stable candidate ID. Publish the numerator, denominator, excluded facilities and incremental gain. Deduplicate reference identities before counting. Equal reference weight is a research assumption. A trivial model where every candidate simply adds itself must be described as such.

Haversine distance or a verified metric CRS may support geometric reference proximity only. Thresholds such as 100/250/500 m would be hypothetical research parameters, never an official signal radius. This release publishes no facility-proximity gain, catchment coverage or synthetic Taipei allocation output.

## Mode C: operational and digital-inclusion gate

Unavailable. Required evidence includes operational status, measured quality, comparable usage, aligned time windows, continuous site identity and appropriate population/demand denominators. Directory presence establishes none of these. Citywide usage totals cannot be allocated to individual hotspots or districts without an independently justified model. No digital-exclusion ranking is produced.

## Sensitivity and interpretation

Compare capacities 5/10/all, strict/broader identity/scope eligibility and stale-source inclusion. Report eligibility counts, exclusion reasons, selected membership and category/district representation. Broader settings change the investigation population, not the confidence assigned to uncertain evidence. Geographic threshold sensitivity is unavailable while Mode B is gated. Unchanged results are a valid result; do not invent differences.

## Reproduction, export and edition migration

Run `npm run data:fetch:wifi-policy`, `npm run data:audit:wifi-policy`, then `npm run data:build:wifi-policy` for the independent policy pipeline. Fetch defaults to validation of retained inputs. `npm run data:fetch:wifi-policy -- --refresh` stores new original bytes and a pending acquisition record under `data/raw/wifi-policy/refresh/`; it does not promote them or overwrite the production acquisition manifest. Adoption requires separately checking catalogue revision, schema, encoding, source identity and coordinate semantics, recording accepted acquisition/hash metadata and deliberately updating the accepted manifest before audit/build. The browser reads generated static JSON only when the decision tab opens; it does not fetch official resources or join GIS data in React renders. JSON/CSV exports retain snapshot/source hashes, method, settings, filters, ordered selected IDs, exclusions, assumptions, unavailable metrics and the responsible-use disclaimer. CSV cells protect against spreadsheet-formula injection.

The existing explorer remains on its retained 3,297-row edition. A deliberate future migration can invoke its existing converter with a specific validated input, then build its summary:

```bash
node --import tsx scripts/convertWifiHotspots.ts data/raw/wifi-policy/A-2026-07-01.csv
node --import tsx scripts/buildWifiSummary.ts
```

These commands intentionally replace explorer outputs and should only run as an explicit edition migration with reviewed count/filter changes. Policy audit/build commands do not perform this migration. An ordinary explorer rebuild must continue to use the retained explorer raw input. Validation evidence, exact output sizes and measured timings belong in [delivery evidence](wifi-allocation-delivery.md); this method document does not imply that an unrun check passed.
