# Policy #8 v1.1 delivery evidence

The retained snapshot `wifi-geographic-79c1bc19e312f8250285e9b9` contains 91 facility records. The audit classified 87 as assumption-tested and four as unresolved. Verified-only yields an empty cohort. The 3,305 published hotspot rows yielded 2,906 distinct eligible coordinate locations for proximity comparisons. The separate explorer retains its 3,297-row edition.

- The [snapshot manifest](../public/data/wifi-policy/geographic-v1.1/manifest.json) records the exact snapshot and geometry hashes.
- The [scenario summaries](../public/data/wifi-policy/geographic-v1.1/scenario-summaries.json) contain the computed comparisons and selection identifiers.
- The [local measurements](evidence/geographic-v1.1/measurements.json) include artifact sizes and warmed scenario timings. Browser map loading time and GitHub runner verification are pending.

On 2026-11-13, the Windows baseline passed `./init.sh`. After the security changes, `npm test` passed all 41 tests and `npm run build` passed. Rebuilding the geographic artifacts and Mode A snapshot reproduced the retained files byte for byte.
