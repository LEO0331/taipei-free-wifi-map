# Taipei Free Wi-Fi Map

[繁體中文](README-zh.md)

A mobile-first bilingual map, nearby finder, directory, and dataset overview for Taipei Free public Wi-Fi hotspot locations.

The site is a static public-data directory. It does **not** show real-time availability, connection speed, signal strength, congestion, or network quality.

## Data source

- Dataset: [Taipei City Public Free Wi-Fi Hotspot Data (new version)](https://data.taipei/dataset/detail?id=6aa6532d-652f-4c1b-814a-4646b75407af)
- Provider: Taipei City Government Department of Information Technology
- Published update frequency: every six months
- Included sample: `data/raw/wifi-hotspots/Taipei_Free_AP_總表1141218.csv`

The browser never calls Taipei Open Data directly. Local scripts fetch and convert CSV into:

```text
public/data/wifi-hotspots.json
public/data/wifi-summary.json
public/data/conversion-report.json
```

## Data workflow

Install dependencies:

```bash
npm install
```

Use an existing CSV under `data/raw/wifi-hotspots/`, or download the official resource:

```bash
npm run data:fetch
npm run data:fetch -- --force
```

Convert the newest raw CSV:

```bash
npm run data:convert
```

Convert a specific uploaded CSV:

```bash
node --import tsx scripts/convertWifiHotspots.ts "/path/to/Taipei_Free_AP_總表1141218.csv"
node --import tsx scripts/buildWifiSummary.ts
```

### Field mapping

The converter maps the official Chinese and English columns into the `WifiHotspot` model, including site/agency IDs, hotspot type, name, vendor, postal code, city, district, address, WGS84 latitude/longitude, and bilingual display fields. Empty optional strings are omitted.

### Coordinate validation

Coordinates are parsed as numbers and classified as `valid`, `missing`, or `outlier` using the broad Taipei/nearby bounds in `src/lib/wifi.ts`. Missing or outlier records remain in the conversion report and directory data but do not render as map markers.

### Outside-Taipei records

Records such as `新店區` are retained with `isTaipeiCity: false`. The app defaults to “Taipei City only”; turning that filter off reveals the outside-Taipei records.

## App features

- Clustered OpenStreetMap markers for more than 3,000 listed hotspots
- Traditional Chinese default with English toggle and Chinese fallback
- Search and district, type, agency, vendor, and Taipei-only filters
- Browser geolocation with 300 m, 500 m, 1 km, and 2 km radii
- Haversine distance sorting and Google Maps destination links
- Paginated hotspot directory
- Static dataset summary cards and distribution charts
- PWA manifest and lightweight service-worker cache

The dashboard describes dataset coverage only. It does not infer historical trends or service quality.

## Development

```bash
npm run dev
npm test
npm run build
npm run preview
```

## Deployment

Vite uses the GitHub Pages base path `/taipei-free-wifi-map/`. The included workflow builds and deploys pushes to `main`.

Expected URL:

```text
https://LEO0331.github.io/taipei-free-wifi-map/
```

For another host or repository name, update `base` in `vite.config.ts`, the manifest `start_url` and `scope`, and the `BASE` constant in `public/sw.js`.

## Disclaimer

This site shows public Wi-Fi hotspot locations from open data and does not represent real-time availability, connection speed, or signal quality. Actual service status should be verified on site and with official notices.

## Policy #8: Wi-Fi allocation and digital inclusion

The independent, bilingual decision-support tab assigns limited **source-verification investigation slots**. Mode A reviews official inventory evidence and compares capacities 5/10/all, Evidence Gaps First and Balanced Facility Review, with explicit identity/scope and stale-source sensitivity. JSON/CSV exports preserve selected source identities, source editions and hashes, assumptions and unavailable metrics.

Mode B now offers **experimental geographic facility proximity review** with historical official district geometry, explicit facility CRS hypotheses, verified-only/assumption-tested cohorts, capacities 5/10/all and source-backed sensitivity/export outputs. This edition admits 87 assumption-tested facility composites and no verified facilities; its actual results have no non-self incremental gain, so optimization conclusions remain unavailable. Mode C requires operational, usage and population/demand evidence. Neither official directory presence nor geographic distance demonstrates working Wi-Fi, actual radio coverage, resident demand or digital inclusion.

The policy pipeline retains original official bytes separately from the explorer:

```bash
npm run data:fetch:wifi-policy
npm run data:audit:wifi-policy
npm run data:build:wifi-policy
```

Fetching, auditing and building policy data do not migrate the original explorer's retained source edition. Refresh downloads require explicit audit/acceptance before a new edition is used. See the [source audit](docs/wifi-allocation-source-audit.md), [methodology and explicit explorer migration](docs/wifi-allocation-methodology.md), [Traditional Chinese MVP](docs/wifi-allocation-decision-mvp.zh-TW.md), and [delivery evidence](docs/wifi-allocation-delivery.md) for actual results, reproducibility and remaining evidence gaps.

## Policy #8 v1.1 geographic research

Python 3.14 is required for the offline GIS audit (no browser GIS dependency). Run `npm run data:setup:geographic`, `npm run data:audit:geographic`, `npm run data:build:geographic` and `npm run data:verify:geographic`. `./init.sh` includes setup, audit and byte-for-byte reproducibility checks. Live source fetching is separate from Pages builds.

See the [source validation](docs/wifi-allocation-v1.1-source-validation.md), [coordinate contracts](docs/wifi-allocation-v1.1-coordinate-contract.md), [methodology and reproduction](docs/wifi-allocation-v1.1-methodology.md), [Traditional Chinese MVP](docs/wifi-allocation-v1.1-decision-mvp.zh-TW.md), [actual source-derived results](docs/evidence/geographic-v1.1/results.md) and [delivery evidence](docs/wifi-allocation-v1.1-delivery.md). v1.0 documents remain historical evidence.
