import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { gzipSync } from 'node:zlib';
import { runWifiPolicyScenario, compareWifiPolicyScenarios } from '../src/lib/wifiPolicyScenarios.js';
import { createWifiPolicyJsonExport, createWifiPolicyCsvExport } from '../src/lib/wifiPolicy.js';
import type { WifiPolicySnapshot, PolicyScenarioSettings } from '../src/types/wifiPolicy.js';

// Optional local measurement, separate from deterministic publication. No network calls.
const bytes = await readFile('public/data/wifi-policy/snapshot.json');
const snapshot = JSON.parse(bytes.toString('utf8')) as WifiPolicySnapshot;
const defaults: PolicyScenarioSettings = { capacity: 5, strategy: 'evidence', eligibility: 'strict', includeStale: false };
const baseline = runWifiPolicyScenario(snapshot, defaults);
const scenarios = [];
for (const capacity of [5, 10, 'all'] as const) {
  for (const strategy of ['evidence', 'balanced'] as const) {
    for (const eligibility of ['strict', 'broader'] as const) {
      const settings = { ...defaults, capacity, strategy, eligibility };
      const timings = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        runWifiPolicyScenario(snapshot, settings);
        timings.push(performance.now() - start);
      }
      timings.sort((a, b) => a - b);
      const result = runWifiPolicyScenario(snapshot, settings);
      const difference = compareWifiPolicyScenarios(baseline, result);
      scenarios.push({ settings, eligible: result.eligibleCount, selected: result.capacityUsed,
        excluded: result.exclusionReasons, districts: result.districts, categories: result.categories,
        firstTenSelectedIds: result.selectedIds.slice(0, 10),
        differenceFromDefault: { added: difference.added.length, removed: difference.removed.length, equivalent: difference.equivalent },
        localMedianMs: timings[50], localP95Ms: timings[95] });
    }
  }
}
const stale = runWifiPolicyScenario(snapshot, { ...defaults, capacity: 'all', includeStale: true });
const all = runWifiPolicyScenario(snapshot, { ...defaults, capacity: 'all', eligibility: 'broader', includeStale: true });
const start = performance.now();
const allCsv = createWifiPolicyCsvExport(snapshot, all);
const csvMs = performance.now() - start;
const assets = await Promise.all((await readdir('dist/assets')).map(async name => ({name, bytes:(await stat(`dist/assets/${name}`)).size})));
const report = { measuredAt: new Date().toISOString(), runtime: process.version, platform: process.platform,
  limitation: 'Local warmed pure-function timings, 100 runs per configuration. No public-host latency guarantee.',
  snapshotId: snapshot.snapshotId, snapshotSha256: createHash('sha256').update(bytes).digest('hex'),
  payloadBytes: bytes.length, gzipBytes: gzipSync(bytes).length, assets,
  reconciliation: snapshot.reconciliation, tiers: snapshot.summary.byTier, issues: snapshot.summary.byIssue,
  sources: snapshot.sourceEditions, scenarios,
  staleStrictAll: { eligible: stale.eligibleCount, selected: stale.capacityUsed },
  allBroaderWithStale: { eligible: all.eligibleCount, selected: all.capacityUsed, csvBytes: Buffer.byteLength(allCsv), localCsvMs: csvMs } };
await mkdir('docs/evidence', {recursive:true});
await writeFile('docs/evidence/policy-measurements.json', JSON.stringify(report, null, 2) + '\n');
await writeFile('docs/evidence/sample-decision.json', createWifiPolicyJsonExport(snapshot, baseline) + '\n');
await writeFile('docs/evidence/sample-decision.csv', createWifiPolicyCsvExport(snapshot, baseline));
console.log(JSON.stringify({snapshotId:report.snapshotId,bytes:report.payloadBytes,gzip:report.gzipBytes,scenarios:scenarios.length,allCsvBytes:report.allBroaderWithStale.csvBytes}));
