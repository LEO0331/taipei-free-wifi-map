import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { hasPolicyTextTranslation, localizePolicyText, policyCandidateLabel } from '../src/lib/wifiPolicyLocale.js';
import { parsePolicyCsv } from '../scripts/auditWifiPolicySources.js';
import { buildSnapshot } from '../scripts/buildWifiPolicySnapshot.js';
import { runWifiPolicyScenario } from '../src/lib/wifiPolicyScenarios.js';
import type { WifiPolicySnapshot } from '../src/types/wifiPolicy.js';

const snapshot = JSON.parse(await readFile('public/data/wifi-policy/snapshot.json', 'utf8')) as WifiPolicySnapshot;

test('all current policy explanations, gates and source metadata have display translations', () => {
  const texts = [snapshot.candidateGrain, snapshot.reconciliation.identityRule, ...snapshot.assumptions, ...snapshot.limitations,
    ...Object.values(snapshot.modes).flatMap(gate => [...gate.reasons, ...gate.requirements]),
    ...snapshot.sourceEditions.flatMap(source => [source.status, source.publisher, source.license, source.eligibility, source.retrievalPrecision, ...(source.exclusionReasons ?? []), ...(source.notes ?? [])]).filter((text): text is string => Boolean(text)),
    ...Object.keys(snapshot.summary.byIssue),
    'district-filter', 'category-filter', 'stale-source', 'ambiguous-identity', 'unverified-taipei-scope'];
  for (const text of texts) {
    assert.ok(hasPolicyTextTranslation(text), `Missing translation for: ${text}`);
    assert.match(localizePolicyText(text, 'zh'), /\p{Script=Han}/u, text);
    assert.doesNotMatch(localizePolicyText(text, 'en'), /\p{Script=Han}/u, text);
  }
});

test('English labels come from the candidate’s own retained source edition, including legacy-only records', async () => {
  const manifest = JSON.parse(await readFile('data/raw/wifi-policy/acquisition-manifest.json', 'utf8'));
  const current = parsePolicyCsv(await readFile(manifest.sources.find((source: { id: string }) => source.id === 'A').path));
  const legacy = parsePolicyCsv(await readFile(manifest.legacy.path));
  const rebuilt = buildSnapshot(current, legacy, snapshot.sourceEditions);
  assert.equal(rebuilt.snapshotId, snapshot.snapshotId);
  const index = (rows: Record<string, string>[]) => new Map(rows.map(row => [JSON.stringify([row.SITE_ID, row.HOTSPOT_ID]), row]));
  const currentIndex = index(current), legacyIndex = index(legacy);
  for (const candidate of snapshot.candidates) {
    const row = (candidate.stale ? legacyIndex : currentIndex).get(JSON.stringify([candidate.siteId, candidate.hotspotId]))!;
    assert.equal(policyCandidateLabel(candidate, 'name', 'en'), row.E_NAME);
    assert.equal(policyCandidateLabel(candidate, 'district', 'en'), row.E_AREA);
    assert.equal(policyCandidateLabel(candidate, 'category', 'en'), row.E_STYPE);
    assert.equal(policyCandidateLabel(candidate, 'name', 'zh'), candidate.name);
    assert.ok(candidate.nameEn && candidate.districtEn && candidate.categoryEn);
  }
});

test('changing display language preserves selected identities and canonical filter values', () => {
  const settings = { capacity: 5 as const, strategy: 'evidence' as const, eligibility: 'strict' as const, includeStale: false, district: '大同區' };
  const before = runWifiPolicyScenario(snapshot, settings);
  for (const candidate of before.selected) {
    for (const language of ['zh', 'en'] as const) policyCandidateLabel(candidate, 'district', language);
  }
  assert.deepEqual(runWifiPolicyScenario(snapshot, settings).selectedIds, before.selectedIds);
  const candidate = { ...snapshot.candidates[0], nameEn: undefined };
  assert.equal(policyCandidateLabel(candidate, 'name', 'en'), candidate.name);
});

test('adding official display fields leaves every investigation selection unchanged', async () => {
  const previous = JSON.parse(await readFile('public/data/wifi-policy/wifi-policy-c250791e7736ed5bca2882ea.json', 'utf8')) as WifiPolicySnapshot;
  assert.deepEqual(snapshot.candidates.map(candidate => candidate.id), previous.candidates.map(candidate => candidate.id));
  assert.deepEqual(snapshot.summary, previous.summary);
  assert.deepEqual(snapshot.reconciliation, previous.reconciliation);
  for (const capacity of [5, 10, 'all'] as const) for (const strategy of ['evidence', 'balanced'] as const) {
    for (const eligibility of ['strict', 'broader'] as const) for (const includeStale of [false, true]) {
      const settings = { capacity, strategy, eligibility, includeStale };
      assert.deepEqual(runWifiPolicyScenario(snapshot, settings).selectedIds, runWifiPolicyScenario(previous, settings).selectedIds);
    }
  }
});
