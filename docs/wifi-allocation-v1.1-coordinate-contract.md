# Facility coordinate contracts — Policy #8 v1.1

The reference unit is a **unique within-edition source-specific name/address composite**, not a verified distinct physical site. No facility has an authoritative original datum declaration in the retained sources or references examined. The audit therefore assigns **0 Verified, 87 Assumption-tested, 4 Unresolved** among 91 records. Assumption-tested permits experimental geometric research with explicit uncertainty; it does not establish entrance accuracy, current operation, public access, equipment suitability, or wireless service.

| Source | Retained edition | Assumption | Records | Assumption-tested | Unresolved |
|---|---|---|---:|---:|---:|
| B libraries | 2026-06-10 | Named longitude/latitude columns interpreted as EPSG:4326 | 70 | 69 | 1 |
| C activity centers | 2025-12-18 | X easting/Y northing interpreted as EPSG:3826, transformed with offline PROJ, always XY | 9 | 9 | 0 |
| D sports centers | 2026-03-02 | Named longitude/latitude columns interpreted as EPSG:4326 | 12 | 9 | 3 |

The B/D assumption is supported by coordinate ranges, complete facility composites, and reviewed address-derived administrative attribution against independently published E polygons. These checks do **not** identify WGS84 conclusively. C admission additionally requires the same transformation to pass for every individual row, with axis-swap rejection and alternative CRS investigation. Nine passing rows support the stated research hypothesis, not its conversion into a publisher declaration.

The strict admission contract requires nonempty name/address, a unique within-edition composite, finite coordinates in the stated research extent, unambiguous polygon attribution, and agreement with the available source district. A missing source district is unresolved. Polygon/source disagreement is an investigation trigger; it does not establish which source is inaccurate. Every excluded record retains its original fields, coordinate strings and provenance.

## CRS alternatives and independent evidence

All nine C records transform into their published districts under the EPSG:3826 hypothesis. Swapping X/Y gives approximately 143°E, 2.5°N, outside the Taipei research extent. An alternative EPSG:3828/TWD67 inverse projection is calculated into its own geographic CRS, EPSG:3821. The pinned offline PROJ installation cannot construct a non-ballpark EPSG:3828-to-EPSG:4326 transformation. Alternative numeric degree values are retained in `coordinateChecks`, explicitly labelled **not admissible WGS84 positions**. They are not silently treated as WGS84. Degree-range or district agreement alone cannot resolve the original datum.

For example, the original C row for 萬華新移民會館 contains X `300625.006`, Y `2770374.449`. Under the stated EPSG:3826 hypothesis this becomes longitude `121.50169671928973`, latitude `25.040655336554796`, in 萬華區. This example is one of nine audited rows, not a standalone validation.

The [official library directory](https://tpml.gov.taipei/cp.aspx?n=1F9AED300D314011), [Civil Affairs hall information](https://ca.gov.taipei/News_Content.aspx?n=59F2E04A34FDA3E8&s=3830F47E22F5BABB&sms=87415A8B9CE81B16), and [historic official sports brochure](https://www-ws.gov.taipei/001/Upload/public/Attachment/64141744961.pdf) were consulted as independent identity/address context. The latter two confirm the named Wanhua hall and Zhongzheng sports center addresses. None supplies a source datum or independent surveyed coordinate control. No numerical positional agreement is claimed from these address references. Library-directory inclusion was not treated as a per-record positional test. The sports venue site's expired TLS certificate was not bypassed; a government-hosted brochure was retained instead.

## Spatial and identity findings

All 91 interpreted positions lie in one official district polygon; none lies within 25 meters of a polygon boundary. Three D records disagree with their address-derived district: 中正運動中心 is polygon-assigned 大安區, 南港運動中心 is 信義區, and 中山運動中心 is 大同區. They are individually excluded. B 士林分館 has no district in its published address and is excluded because administrative source attribution remains unresolved. The facility name is not substituted for a published district field.

C retains the source `區別` column. B/D have no district column: `sourceDistrictOrigin: address-derived` explicitly identifies extraction of a Taipei district token from the original address. Neither is presented as an independent positional control.

The actual cohort has zero duplicate exact normalized name/address composites, zero same-address groups, zero cross-source exact-address groups, and zero repeated coordinate pairs. This does not establish physical distinctness: fuzzy matching, floor/address normalization, and cross-source merging are deliberately absent. Potential groups are reported when exact normalized addresses coincide; records remain distinct. Duplicate composites, including conflicting-coordinate composites, are individually excluded with separate collision IDs.

An ID is `facility-{source}-{first24(SHA256(source + NUL + sourceSHA256 + NUL + normalizedName + NUL + normalizedAddress))}`. Normalization uses Unicode NFKC, whitespace removal, and the spelling 台北市→臺北市. This is an edition-scoped research identity; it makes no longitudinal identity claim. The original source row and all original fields remain available in every record.

## Portable evidence and reproduction

Run `node --import tsx scripts/auditWifiFacilityCoordinates.ts` after the pinned Python environment setup. The atomic publication path is `public/data/wifi-policy/geographic-v1.1/`:

- `facilities-audit.json`: all records, checks, source hashes, independent reference manifest, identity diagnostics, and summary.
- `eligible-facilities.json`: 87 assumption-tested records.
- `excluded-facilities.json`: four unresolved records with exclusion reasons.

`tests/wifiFacilities.test.ts` executes the real retained sources and synthetic bounded ODS/duplicate/missing-field/numeric rejection fixtures. The source audit fails closed on any upstream source hash or retained reference hash mismatch. Historical v1.0 source bytes and snapshot are unchanged.
