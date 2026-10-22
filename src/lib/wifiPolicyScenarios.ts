const lexical = (a:string,b:string) => a < b ? -1 : a > b ? 1 : 0;
import type { PolicyCandidate, PolicyScenario, PolicyScenarioSettings, WifiPolicySnapshot } from '../types/wifiPolicy.js';

export function runWifiPolicyScenario(snapshot: WifiPolicySnapshot, settings: PolicyScenarioSettings): PolicyScenario {
  if(![5,10,'all'].includes(settings.capacity)||!['evidence','balanced'].includes(settings.strategy)||!['strict','broader'].includes(settings.eligibility)||typeof settings.includeStale!=='boolean')throw new Error('Unsupported policy scenario configuration.');
  const reasons: Record<string, number> = {};
  const eligible = snapshot.candidates.filter(c => {
    const reason = settings.district && c.district !== settings.district ? 'district-filter'
      : settings.category && c.category !== settings.category ? 'category-filter'
      : c.stale && !settings.includeStale ? 'stale-source'
      : !c.identityVerified && settings.eligibility === 'strict' ? 'ambiguous-identity'
      : c.scope !== 'taipei-source' && settings.eligibility === 'strict' ? 'unverified-taipei-scope' : null;
    if (reason) reasons[reason] = (reasons[reason] ?? 0) + 1;
    return !reason;
  }).sort((a, b) => lexical(a.tier,b.tier) || lexical(a.id,b.id));
  let ordered = eligible;
  if (settings.strategy === 'balanced') {
    // Balance trusted published facility categories; no geographic certification is inferred.
    const groups = new Map<string, PolicyCandidate[]>();
    for (const c of eligible) groups.set(c.category, [...(groups.get(c.category) ?? []), c]);
    const queues = [...groups.entries()].sort(([a], [b]) => lexical(a,b)).map(([, items]) => items);
    ordered = [];
    for (let i = 0; ordered.length < eligible.length; i++) for (const queue of queues) if (queue[i]) ordered.push(queue[i]);
  }
  const selected = ordered.slice(0, settings.capacity === 'all' ? ordered.length : settings.capacity);
  return {
    snapshotId: snapshot.snapshotId, objective: 'Mode A — source evidence investigation slots', settings: { ...settings },
    eligibleCount: eligible.length, excludedCount: snapshot.candidates.length - eligible.length, exclusionReasons: reasons,
    capacityUsed: selected.length, selectedIds: selected.map(c => c.id), selected,
    districts: [...new Set(selected.map(c => c.district).filter(Boolean))].sort(),
    categories: [...new Set(selected.map(c => c.category))].sort(),
    verifiedMetrics: ['Published record counts', 'Source evidence issue counts', 'Selected source-row identities'],
    unavailableMetrics: ['Actual Wi-Fi coverage', 'Operational availability', 'Digital inclusion', 'Resident demand', 'Geographic proximity gain'],
    assumptions: [...snapshot.assumptions, 'Balanced review round-robins published facility categories while preserving tier/ID order within each category.', 'Broader eligibility admits ambiguous rows for investigation only; it does not validate their identity or location.'],
  };
}

export function compareWifiPolicyScenarios(a: PolicyScenario, b: PolicyScenario) {
  if (a.snapshotId !== b.snapshotId) throw new Error('Cannot compare scenarios from different source editions.');
  const left = new Set(a.selectedIds), right = new Set(b.selectedIds);
  const added = b.selectedIds.filter(id => !left.has(id));
  const removed = a.selectedIds.filter(id => !right.has(id));
  return { added, removed, unchanged: a.selectedIds.filter(id => right.has(id)).length, equivalent: !added.length && !removed.length };
}
