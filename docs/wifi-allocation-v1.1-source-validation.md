# Source validation — Policy #8 v1.1

This audit uses retained official source bytes. Retrieval of supporting references on 2026-10-22 does not change the historical editions or certify live facility operation.

| Source | Edition | SHA-256 |
|---|---|---|
| B | 2026-06-10 | `82f4e1aedafd3b68a9b6adc619fdd5e00e4871c3c94100201eefdb12070e0847` |
| C | 2025-12-18 | `368778b0c649f24b05cc0383172afb0e1b804c332541e2d33a2117d7d83834a0` |
| D | 2026-03-02 | `23c5ce0906358d8f95b2f1a8e1b019487cd7fa564b2cf188681648d23c89b11c` |

The [B catalogue](https://data.taipei/dataset/detail?id=43772803-6504-469c-894d-35904342a53b), [C catalogue](https://data.taipei/dataset/detail?id=5ed70753-73a4-4fc1-b78c-df09f7499594), and [D catalogue](https://data.taipei/dataset/detail?id=80be7612-593f-4795-9935-a10ce0f7b75b) describe coordinate column names but provide no independent datum or positional accuracy declaration. Current catalogue metadata is context; retained source bytes determine model editions. The E geometry transformation and A hotspot attribution are recorded separately in `boundary-validation.json` and `hotspots-audit.json`.

The production C parser uses only Python standard-library ZIP/XML tools. It verifies safe member paths, limits member sizes, rejects XML entity declarations, requires one sheet, bounds populated repeated rows/cells, and safely truncates unpopulated trailing spreadsheet cells. It preserves displayed numeric strings and original field names. The retained sheet contains nine data rows and 16,377 repeated empty trailing cells per populated row. These empty cells do not become artificial records. CSV sources use strict UTF-8/BOM decoding and row-width/header checks.

Authoritative supporting references were retained under `data/raw/wifi-policy/geographic-evidence/`; `manifest.json` records exact URLs, original-byte hashes, byte counts, retrieval date, purpose and the failed TLS attempt. They establish identity/address context only. They do not independently verify the coordinate datum or a surveyed public control location.

| Reference | Bytes | SHA-256 |
|---|---:|---|
| `library-directory.html` | 170,140 | `f45fbe3d38597f1c0dda8bbf90d442c011196c7a8167877850d3e2694c040b05` |
| `new-immigrants-hall.html` | 126,618 | `6923b285d29b2b73a9f7b8dd2eec74814647ca557628d217860db36fc7926698` |
| `zhongzheng-sports.pdf` | 1,885,548 | `4a6f4c17f24a99f34bf11408006b6cce9c272417a3dfe081a3b953419450d49f` |

Actual facility results: 91 examined; 0 Verified; 87 Assumption-tested; 4 Unresolved. All 91 interpretations receive a polygon assignment; three disagree with the address-derived source district. No position lies within 25 meters of a district boundary. Exact identity/address/coordinate diagnostics yield no duplicates in this edition. See the [coordinate contract](wifi-allocation-v1.1-coordinate-contract.md) for individual exclusions, assumptions, identity grain and alternative CRS limitations.

The experimental model may admit assumption-tested evidence with a clearly stated setting. Verified-only has a zero facility denominator and must present an unavailable/empty state. Unknown original datum and absence of independent surveyed positional controls remain material limitations even when scenario selections are stable.
