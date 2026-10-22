import type { GeographicScenario, GeographicSettings, GeographicSnapshot, GeographicSelection } from '../types/wifiGeographicPolicy.js';

export const defaultGeographicSettings: GeographicSettings = { capacity: 5, strategy: 'marginal', evidence: 'assumed', radius: 100, geography: 'strict', cohort: 'all' };
const lexical = (a: string,b: string) => a < b ? -1 : a > b ? 1 : 0;

export function runGeographicScenario(snapshot: GeographicSnapshot, versionId: string, settings: GeographicSettings): GeographicScenario {
  if (snapshot.methodVersion !== 'wifi-geographic-proximity-experiment-v1' || snapshot.versionId !== versionId || !/^wifi-geo-[a-f0-9]{24}$/.test(versionId)) throw new Error('Geographic version mismatch');
  if (![5,10,'all'].includes(settings.capacity) || ![100,250,500].includes(settings.radius) || !['marginal','representation'].includes(settings.strategy) || !['verified','assumed'].includes(settings.evidence) || !['strict','flagged'].includes(settings.geography) || !['all','B','C','D'].includes(settings.cohort)) throw new Error('Unsupported geographic scenario');
  const excluded = snapshot.facilities.map(f => ({id:f.id,reasons:[
    ...(!f.eligible || f.tier === 'unresolved' ? f.issues.length ? f.issues : ['unresolved'] : []),
    ...(settings.evidence === 'verified' && f.tier !== 'verified' ? ['requires-verified'] : []),
    ...(settings.cohort !== 'all' && settings.cohort !== f.source ? ['other-cohort'] : []),
    ...(settings.geography === 'strict' && f.spatial.status !== 'interior' ? ['strict-interior-required'] : []),
  ]})).filter(f => f.reasons.length).sort((a,b)=>lexical(a.id,b.id));
  const rejected = new Set(excluded.map(f => f.id));
  const population = snapshot.facilities.filter(f => !rejected.has(f.id)).sort((a,b) => lexical(a.id,b.id));
  const referenceIds = new Set(population.map(f => f.id));
  const baselineIds = population.filter(f => {
    const d = f.nearestHotspotMeters[settings.geography];
    return d !== null && d <= settings.radius;
  }).map(f => f.id);
  const counted = new Set(baselineIds);
  const associations = new Map(population.map(f => [f.id, [...new Set(f.neighbors.filter(n => n.meters <= settings.radius && referenceIds.has(n.id)).map(n => n.id))]]));
  // A self-only association can never establish a meaningful geographic gain.
  const uncoveredNeighborhoods = population.map(f => (associations.get(f.id) ?? []).filter(id=>!counted.has(id)).sort(lexical));
  const optimizationAvailable = new Set(uncoveredNeighborhoods.map(ids=>JSON.stringify(ids))).size>1 && population.some(f => (associations.get(f.id) ?? []).some(id => id !== f.id && !counted.has(id)));
  const remaining = [...population], selected: GeographicSelection[] = [];
  const groups = new Map<string,number>();
  const limit = settings.capacity === 'all' ? remaining.length : Math.min(settings.capacity,remaining.length);
  while (selected.length < limit) {
    const gain = (id: string) => (associations.get(id) ?? []).filter(r => !counted.has(r));
    remaining.sort((a,b) => {
      if (settings.strategy === 'representation') {
        const ga = `${a.spatial.district}|${a.source}`, gb = `${b.spatial.district}|${b.source}`;
        const balance = (groups.get(ga) ?? 0) - (groups.get(gb) ?? 0);
        if (balance) return balance;
      }
      return (optimizationAvailable ? gain(b.id).length - gain(a.id).length : 0) || lexical(a.id,b.id);
    });
    const candidate = remaining.shift()!;
    const newReferenceIds = gain(candidate.id);
    const ownReference = Number(newReferenceIds.includes(candidate.id));
    selected.push({id:candidate.id, ownReference, additionalReferences:newReferenceIds.length-ownReference,
      marginalReferences:newReferenceIds.length, newReferenceIds,
      reason:settings.strategy === 'representation' ? 'representation' : optimizationAvailable ? 'marginal' : 'descriptive-only'});
    for (const id of newReferenceIds) counted.add(id);
    const group = `${candidate.spatial.district}|${candidate.source}`;
    groups.set(group,(groups.get(group) ?? 0)+1);
  }
  return {versionId,methodVersion:snapshot.methodVersion,settings:{...settings},candidateCount:population.length,capacityUsed:selected.length,
    referenceDenominator:population.length,excludedCount:excluded.length,baselineProximate:baselineIds.length,
    newlyProximate:counted.size-baselineIds.length,ownContributions:selected.reduce((n,s)=>n+s.ownReference,0),
    additionalContributions:selected.reduce((n,s)=>n+s.additionalReferences,0),optimizationAvailable,selfReferenceModel:true,
    selected,selectedIds:selected.map(s=>s.id),districts:[...new Set(population.filter(f=>selected.some(s=>s.id===f.id)).map(f=>f.spatial.district!))].sort(lexical),
    categories:[...new Set(population.filter(f=>selected.some(s=>s.id===f.id)).map(f=>f.source))].sort(lexical),baselineIds,excluded,
    unavailableMetrics:['radio-coverage','connectivity','people-served','digital-inclusion','installation-suitability',...(!optimizationAvailable?['optimization-conclusion']:[])]};
}

export function compareGeographicScenarios(current: GeographicScenario, alternate: GeographicScenario) {
  if (current.versionId !== alternate.versionId || current.methodVersion !== alternate.methodVersion) throw new Error('Scenario version mismatch');
  const a = new Set(current.selectedIds), b = new Set(alternate.selectedIds);
  return {added:alternate.selectedIds.filter(id=>!a.has(id)),removed:current.selectedIds.filter(id=>!b.has(id)),shared:current.selectedIds.filter(id=>b.has(id)),
    denominatorChange:alternate.referenceDenominator-current.referenceDenominator,
    baselineChange:alternate.baselineProximate-current.baselineProximate,incrementChange:alternate.newlyProximate-current.newlyProximate,
    addedDistricts:alternate.districts.filter(d=>!current.districts.includes(d)),removedDistricts:current.districts.filter(d=>!alternate.districts.includes(d)),
    addedCategories:alternate.categories.filter(d=>!current.categories.includes(d)),removedCategories:current.categories.filter(d=>!alternate.categories.includes(d))};
}
