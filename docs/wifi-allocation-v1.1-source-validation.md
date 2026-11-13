# Policy #8 v1.1 source and geometry validation

Audit date: 2026-10-22, Asia/Taipei. Base `b6422424c3d8e6b98a3aaa13701f0d0c1e517c14` includes merged PR #4 and #5. Original bytes and acquisition dates remain unchanged. All accepted filenames, editions, original SHA-256 values and derived hashes are listed in [actual results](evidence/geographic-v1.1/results.md). The pipeline hardcodes accepted A–E hashes and filenames; a new edition requires an explicit admission change.

The original `wifi-policy-c250791e7736ed5bca2882ea` snapshot independently matches SHA-256 `91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82`. The localization snapshot/pointer also remain unchanged. Mode A retains 3,316 candidates, tiers 63/57/3,196 and strict population 3,293. The explorer retains 3,297 records. No portfolio repository is changed.

## Boundary contract

E is the retained official 2024-09-16 district archive. Its actual PRJ declares `TWD_1997_TM_Taiwan`, GRS80, central meridian 121°, scale 0.9999, false easting 250,000m and northing 0m. `pyproj.CRS.equals(EPSG:3826, ignore_axis_order=True)` confirms the projected CRS. Unsupported/contradictory PRJs fail. [EPSG:3826](https://epsg.io/3826) documents easting/northing axes and the selected TWD97-to-WGS84 approximation. The operation is `Inverse of Taiwan 2-degree TM zone 121 + TWD97 to WGS 84 (1) + axis order change (2D)`, stated accuracy 1m. This is operation accuracy, not source positional accuracy.

PROJ runs offline, `always_xy=True`, `allow_ballpark=False`. Output is RFC 7946 longitude/latitude, with no legacy GeoJSON CRS member, normalized exterior/interior orientation and all multipart components preserved. Coordinates serialize to nine decimal places, metric diagnostics to six; these are serialization choices, not accuracy claims. Raw SHP rings must already be closed and finite before Shapely construction. No automatic repair is allowed.

The ZIP reader rejects traversal, absolute/drive paths, duplicate entries, excessive entry counts or expansion. All five components must share one stem. SHX offsets and lengths must agree with SHP records. CPG explicitly supplies UTF-8; DBF names and codes (`TNAME`, `PTNAME`, `CPTID`, `COUN_ID`) must agree and be unique. All source-confirmed 12 districts pass identity, finite extent, topology, ring, axis and round-trip checks. The complete original DBF attributes remain in GeoJSON. Maximum round-trip error and each district's parts/holes are retained in the coordinate audit.

Eleven original district-pair overlaps are measured, each below the explicit 1m² admission tolerance (largest 0.407474m²). They remain in the output; no sliver is erased. Larger overlaps fail admission. A point matching multiple polygons is ambiguous. These source defects are distinct from conversion corruption. There are no recorded repairs, empty geometries or rejected districts. The archive is historical evidence, not proof of current administrative currency.

The independent analytic projection-definition control is `[250000,0] → [121,0]`. This checks axes/central meridian/false origin, not real-world facility position. The retained C example is a regression fixture, not an independently surveyed control. No suitable independently surveyed named-facility control was established; this limitation is explicit.

## Point attribution

Attribution uses original projected polygons and inverse-transformed points. A 0.001m numerical tolerance recognizes exact shared edges after projection/serialization. It is separate from 10/25/50m uncertainty experiments. Unique membership more than 10m from an edge is `interior`; unique membership within 10m is `boundary-adjacent`; no membership is `exterior`; multiple matches are `ambiguous`. Projection/coordinate failure is `invalid` with null distance. Source district disagreement never proves inaccurate coordinates and never triggers silent correction.

A: 3,305 rows; 3,234 interior, 59 boundary-adjacent, 12 exterior, no multi-match/invalid source coordinates. There are 64 source/polygon district disagreements. Published source-labelled outside-Taipei rows remain retained. Source identity, Taipei label, unique SITE_ID/HOTSPOT_ID pair, geometry membership and source/polygon agreement qualify 3,229 rows before strict boundary filtering. Duplicate coordinates occur in 200 groups; repeated SITE_ID count is zero. Duplicated coordinates do not multiply proximity or imply unique installations.

B/C/D: all 91 coordinates fall inside a polygon under their respective assumptions. There are three explicit district disagreements in sports centers, plus one library whose address does not establish an explicit district label. All four remain visible and excluded. Remaining 87 pass the assumption-tested contract. Verified count is zero; no operation/accessibility inference is made.

## Independent official source research

Retained official B/C/D catalogue metadata lists coordinate columns but no EPSG/WGS84/TWD97 datum contract. Live official catalogue inspection likewise did not establish it. The [official library directory](https://tpml.gov.taipei/cp.aspx?n=1F9AED300D314011) corroborates names/addresses and links maps; it does not establish surveyed coordinate accuracy. The [Wanhua public page](https://whdo.gov.taipei/cp.aspx?n=72C293BB951C97AE&s=BBDDA4CDDADD08C7) corroborates 萬華新移民會館 at 長沙街2段171號. The [official Zhongzheng sports venue page](https://vbs.sports.taipei/venues/?K=798) corroborates the center's 中正區 identity/location context. These are identity references, not independent numeric coordinate controls. We do not equate agreement among fields originating in one source with independent evidence.

See [coordinate contracts](wifi-allocation-v1.1-coordinate-contract.md), [methodology](wifi-allocation-v1.1-methodology.md), and the complete per-record coordinate/hotspot audits referenced by the geographic manifest.
