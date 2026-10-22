# Policy #8 official-source audit

Audit date: **2026-10-22 (Asia/Taipei)**. This audit inspected the actual downloaded resources before accepting a decision model. All six official data resources and all three guidance pages were acquired. Original bytes are retained under `data/raw/wifi-policy/`; SHA-256, byte counts, exact URLs, catalogue HTML and source-specific exclusions are in `acquisition-manifest.json`. No legacy explorer source was replaced.

## Acquisition and timestamp contract

The catalogue pages independently establish the dataset-to-resource relationship, resource update dates and publisher. HTTPS downloads used the catalogue links; the default sandbox could not resolve the official hosts, and approved network access succeeded. Binary/CSV download failure in a text-only web extractor is not evidence that the resource is unavailable.

Current retrieval is known to the day, 2026-10-22. Exact download completion times were not recorded, so `retrievedAt` is null and `retrievalDate` plus `retrievalPrecision: day` preserve the known evidence without inventing precision. Catalogue publication times below are displayed local Taiwan times, distinct from acquisition and processing dates. Filesystem mtime is not used as original acquisition evidence.

The legacy `download-metadata.json` says `reusedExistingFile: true`; its `downloadedAt` is not independently established as the original download time. The policy manifest records legacy acquisition and official publication time as unknown. The filename `1141218` is a retained edition label, not proof of an official publication timestamp. Rebuilds must retain these acquisition facts.

Catalogue licenses are `公開`, with the platform linking Government Data Open License, Version 1.0. Attribute the respective Taipei City Government publisher and link the original catalogue. Record the snapshot edition and hash with derived research. Website guidance remains attributed to the Department of Information Technology; avoid republishing complete guidance articles.

## Source inventory

All catalogue URLs use `https://data.taipei/dataset/detail?id=DATASET_ID`. Download URLs for A–E use `https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=RESOURCE_ID`.

| Source | Publisher | Dataset ID | Verified current resource ID | Resource update (Taiwan time) | Original retained bytes | Records |
| --- | --- | --- | --- | --- | ---: | ---: |
| A hotspot inventory | 資訊局 | 6aa6532d-652f-4c1b-814a-4646b75407af | 549b3a9b-eb6c-4cb1-848b-8c238735e2db | 2026-07-01 15:32:22 | 1,630,629 | 3,305 |
| B public libraries | 教育局 | 43772803-6504-469c-894d-35904342a53b | fb6cc268-e2b8-43a7-86f2-e79702291a2b | 2026-06-10 11:19:35 | 7,185 | 70 |
| C halls/activity centers | 民政局 | 5ed70753-73a4-4fc1-b78c-df09f7499594 | 5ae02e14-50fc-4906-86a7-96e0231780e1 | 2025-12-18 09:53:42 | 6,466 | 9 |
| D sports centers | 體育局 | 80be7612-593f-4795-9935-a10ce0f7b75b | e7c46724-3517-4ce5-844f-5a4404897b7d | 2026-03-02 16:48:05 | 1,527 | 12 |
| E district boundaries | 民政局 | 1601ef3a-c253-4988-b047-943d9e786143 | d8b7eb29-136f-49fc-b14b-3489d3656122 | 2024-09-16 15:17:18 | 174,449 | 12 polygons |
| F citywide internet statistics | 主計處 | b5925972-67f6-45da-a2ff-3208bbe64f14 | Publisher-hosted time-series download | system integration; metadata 2026-02-26 18:25:18 | 2,760 | 28 annual rows |

A's published frequency is every six months. B and D list annual updates; C/E irregular updates. Catalogue metadata update and resource date can differ: B metadata 2026-10-15 does not turn its June CSV into an October source edition; E's archive contains a layer named 20220915 and is not a 2025 geometry solely because the catalogue metadata changed then.

## Byte integrity

| Retained file | SHA-256 |
| --- | --- |
| A-2026-07-01.csv | 09c150e7b8a75e1477413ddcc37059fe97b3c2353ac9f8799069e65d8f81cc55 |
| B-2026-06-10.csv | 82f4e1aedafd3b68a9b6adc619fdd5e00e4871c3c94100201eefdb12070e0847 |
| C-2025-12-18.ods | 368778b0c649f24b05cc0383172afb0e1b804c332541e2d33a2117d7d83834a0 |
| D-2026-03-02.csv | 23c5ce0906358d8f95b2f1a8e1b019487cd7fa564b2cf188681648d23c89b11c |
| E-2024-09-16.zip | 77bcc347b503b8ff8a43f7e1afaaedb18877a6222282587b145adaba69afd2d9 |
| F-time-series.csv | 35abcf8bf6c068d512ebb854028b59635a6defd8404afd1c84970ee1f9137100 |
| ../wifi-hotspots/Taipei_Free_AP_總表1141218.csv | c230610998a33309677fa235ec11b05d047bf3c9379dc6a7683ff3645a422c15 |

The manifest additionally hashes the six catalogue HTML files and three G guidance HTML files. `reconciliation-observations.json` is explicitly a **derived audit observation**, not an original source resource.

## A — inventory schema, identity and edition comparison

Actual UTF-8 CSV columns, in order:

`SITE_ID, Agency Codes, MINISTRY, AGENCY, STYPE, NAME, VENDOR_ID, HOTSPOT_ID, ZipCode, county, AREA, ADDR, LATITUDE, LONGITUDE, E-MINISTRY, E_AGENCY, E_STYPE, E_NAME, E_CITY, E_AREA, E_ADDR`.

All 21 fields are nonblank in the current file. Both editions have unique nonblank SITE_ID and HOTSPOT_ID values, with SITE_ID equal to HOTSPOT_ID on every row. These columns identify source records in these editions; neither proves a unique physical building or radio. Matching a unique unchanged source ID is an edition reconciliation rule, not proof that equipment identity persisted.

| Audit measure | Retained legacy | Current July 2026 |
| --- | ---: | ---: |
| CSV records / unique SITE_ID / unique HOTSPOT_ID | 3,297 | 3,305 |
| Duplicate IDs / missing IDs | 0 / 0 | 0 / 0 |
| Invalid numerical global longitude/latitude bounds | 0 | 0 |
| Source county 臺北市 | 3,285 | 3,293 |
| Source county 新北市, district 新店區 | 12 | 12 |
| Distinct numerical coordinate pairs | 2,895 | 2,906 |
| Additional rows at repeated coordinate pairs | 402 | 399 |

Source administrative labels are not polygon-based membership. The existing broad coordinate check also does not prove Taipei boundary inclusion. The twelve outside-Taipei records must remain retained with an explicit exclusion/scope flag. Colocation suggests overlapping published locations; it does not justify merging physical sites automatically.

There are **3,286 shared IDs, 19 added IDs, 11 missing legacy IDs**, and 637 shared records with some string field changed. Coordinate text differs for 596 shared IDs, but numerical coordinates differ for only **33**; most text changes reflect formatting/precision. Category changed for 1 shared ID, Chinese name for 56, and any non-coordinate metadata for 75. These categories overlap and must not be summed. Missing rows, new identifiers and changed coordinates are publication differences, never automatic physical installation/removal/movement claims.

Added: TPEE004334–TPEE004346, TPEE004348–TPEE004353 (19 IDs; TPEE004347 is absent). Missing from current: TPEE001177, TPEE002792–TPEE002795, TPEE003541, TPEE004285–TPEE004289. Stable IDs alone cannot resolve whether any removed/new records describe the same real facility; similar names are not accepted joins. Detailed distributions and changes are regenerated by the policy audit pipeline from retained inputs.

| Source district | Legacy | Current |
| --- | ---: | ---: |
| 中山區 | 269 | 271 |
| 中正區 | 431 | 428 |
| 信義區 | 482 | 482 |
| 內湖區 | 192 | 192 |
| 北投區 | 187 | 186 |
| 南港區 | 198 | 198 |
| 士林區 | 332 | 340 |
| 大同區 | 206 | 206 |
| 大安區 | 343 | 343 |
| 文山區 | 290 | 295 |
| 松山區 | 125 | 126 |
| 萬華區 | 230 | 226 |
| 新店區 (outside Taipei) | 12 | 12 |

| Hotspot type | Legacy | Current |
| --- | ---: | ---: |
| 公園 | 89 | 88 |
| 公眾服務 | 146 | 148 |
| 公車站 | 887 | 887 |
| 商圈市集 | 309 | 309 |
| 圖書館 | 261 | 268 |
| 大眾運輸 | 12 | 12 |
| 社區中心 | 204 | 203 |
| 藝文場館 | 186 | 181 |
| 行政機關 | 691 | 696 |
| 觀光名勝 | 12 | 12 |
| 遊客中心 | 2 | 2 |
| 運動場館 | 96 | 96 |
| 醫院 | 402 | 403 |

Vendor TAIFO accounts for every record in each edition. Agency distributions must be read as source attribution; agency/type corrections are evidence-review questions, not measured service changes. The current inventory supersedes the legacy only for the separately versioned policy snapshot; explorer migration remains an explicit future operation.

## B — actual production library CSV

The current catalogue links resource `fb6cc268-e2b8-43a7-86f2-e79702291a2b`, filename `臺北市立圖書館各分館暨民眾閱覽室一覽表(0610修).csv`. This audit uses that current link, not a guessed historical/retired library download.

Actual fields: `閱覽單位, 地址, 郵遞區號, 電話, 傳真, 緯度, 經度`. All 70 rows have name, address and coordinate values. Telephone missing in 7 rows and fax in 11. No duplicate exact `(閱覽單位, 地址)` composite keys. Latitude range 24.979629–25.145603 and longitude 121.46415–121.624044 are plausible geographic degrees. The schema names latitude and longitude but neither the file nor inspected catalogue independently specifies datum, positional accuracy, building entrance precision, active status or accessibility.

There is no publisher facility ID. A future source-specific `(name,address)` composite may be acceptable after documented collision/identity checks, but it cannot promise longitudinal identity. No library-to-hotspot name join is accepted. **Retained but Mode B ineligible in this conservative v1 pending coordinate/identity contract validation**. Missing phone/fax is not a service exclusion. Geocoding and invented coordinates are prohibited.

## C — ODS halls and activity centers

The actual resource is a ZIP-based ODS with `content.xml`, repeated cell counts and nine nonempty data rows. Actual columns: `編號, 區別, 集會堂或活動中心名稱, 地址, 電話, 座標X, 座標Y`. IDs 1–9 are edition row numbers; uniqueness does not establish stable facility IDs.

Example: 萬華新移民會館 has X=300625.006, Y=2770374.449. These are projected coordinates, certainly not longitude/latitude. The inspected file and catalogue do not explicitly identify the projected CRS; numerical resemblance to a Taiwanese projected system is insufficient. All nine rows have seven populated values. No cross-source identity join is accepted. **Excluded from Mode B: unresolved CRS and no accepted production ODS conversion contract**. Original ODS retained, no lossy conversion presented as source evidence.

## D — sports centers

Actual fields: `名稱, 郵遞區號, 地址, 電話, 網址, 經度, 緯度`. Twelve rows, no missing fields and no exact `(名稱, 地址)` collisions. Latitude 24.997–25.1126, longitude 121.5053–121.5796; coordinates generally show four decimal places, which is not a guarantee of positional accuracy. No publisher facility ID, source datum declaration, active-status field or public-access validation. **Retained but Mode B ineligible under the same coordinate/identity gate as B**. Website/contact records do not establish installation permission or backhaul availability.

## E — district geometry

Actual ZIP entries: `G97_A_CADIST_P.cpg`, `.dbf`, `.prj`, `.shp`, `.shx`; SHX contains 12 records. The `.prj` explicitly declares `TWD_1997_TM_Taiwan`, GRS1980, Transverse Mercator, central meridian 121°, false easting 250000 m, false northing 0, scale 0.9999, latitude of origin 0, metres. This is strong CRS evidence and must not be interpreted as geographic degrees.

The catalogue fields are AREA, PERF_ID, COUN_ID, CPID, CPTID, NPID, NPTID, PNAME, TNAME, PTNAME, TM2_MAX_X/Y, TM2_MIN_X/Y, MAX_X/Y, MIN_X/Y. Original polygon evidence is retained. **V1 does not certify spatial membership from this archive**: a reviewed projected-SHP ingestion/coordinate-conversion path is not part of the minimal production pipeline. Boundary ambiguity must remain visible; use source administrative fields explicitly labelled as such for documentation balancing. A broad bounding box is not a substitute for polygon validation.

## F — historical citywide context

Actual download: [Taipei statistics time series](https://tsis.dbas.gov.taipei/statis/webMain.aspx?compmode=0&cycle=4&deflst=2&funid=A05035801&kind=21&nzo=1&outkind=1&outmode=12&sys=220&type=0&ymf=8700).

UTF-8 CSV: 28 annual rows, ROC87–114 (1998–2025); 14 columns, no empty string cells. Exact schema is in the manifest. It contains annual citywide website visits, service-platform visits, TaipeiPass cumulative accounts, Taipei Free hotspot counts [處], account counts [個], usage [人次], training cumulative attendance, application counts/downloads and open-data totals. Actual CSV uses `台北服務通造訪人次[人次]`, while the catalogue description labels the corresponding platform differently: this difference is preserved.

Final year 114 lists 3,488 Taipei Free hotspots and 259,528,129 usage [人次]. This annual citywide statistical unit and period differ from the July-2026 location-record inventory; the difference does not establish missing sites or exact usage per hotspot. Zeros may reflect unavailable/discontinued historical metrics; no assumption that zero equals observed demand is accepted. **Context only**, excluded from local demand, quality, equity and allocation calculations. Do not spread usage totals across records/districts.

## G — operating guidance and interpretation

All three official original HTML pages are retained and hashed:

- [Service overview](https://doit.gov.taipei/cp.aspx?n=1609B3D5610C2499): page content update 2026-01-07; explains public-space service and links management guidance.
- [Service hours and locations](https://doit.gov.taipei/News_Content.aspx?n=6466282DBED7C6B2&s=E92A7CA626F7C021): content update 2024-05-16, reviewed 2026-07-06. Indoor use follows facility operating hours; outdoor public-location service is described as available around the clock.
- [Reception limitations](https://doit.gov.taipei/News_Content.aspx?n=6466282DBED7C6B2&s=771274C4C9C0AEF8): content update 2024-05-16, reviewed 2026-07-06. Buildings and other obstructions affect outdoor reception; the guidance does not guarantee signal quality in homes, offices, businesses, alleys or mountains.

These general descriptions do not establish whether any individual hotspot operates now. There is no measured radio radius, throughput, uptime or local demand evidence. Geographic distance can support geometric reference proximity only after accepted point-coordinate semantics; it cannot support actual RF coverage or digital-inclusion outcomes.

## Accepted evidence gates and unresolved work

**Mode A accepted:** current-versus-retained source-record comparison, transparent identity diagnostics, numerical-coordinate validity, source administrative grouping, documentation investigation slots. Preserve all input rows and unresolved removed/new identities. Changes in source metadata are not connectivity harm.

**Mode B disabled in v1:** B/D are real acquired facility resources but their coordinate datum/accuracy and stable identity contracts are not independently accepted. C has unresolved projected CRS; E requires reviewed offline polygon ingestion. A source download alone does not pass an analytical eligibility gate. This is a completed evidence-readiness fallback, not a claimed verified geographic allocation model.

**Mode C unavailable:** A–G do not establish site-specific operating status, uptime, connection quality, comparable usage time windows, site continuity, population denominators or local service demand. No digital-exclusion ranking or operational quality score is justified.

Future work: obtain publisher coordinate specifications and facility identity guidance; validate an offline projection/polygon path against known control points; verify facility operation/access and candidate/reference grain; add actual operational/demand evidence only with compatible identifiers, periods and denominators. These are explicit evidence dependencies, not fabricated production results.
