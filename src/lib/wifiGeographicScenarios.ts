import type { GeographicFacility, GeographicScenario, GeographicScenarioSettings, GeographicSelection, GeographicSnapshot } from '../types/wifiGeographicPolicy.js';
const lexical = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export const DEFAULT_GEOGRAPHIC_SETTINGS: GeographicScenarioSettings = { evidence: 'verified-only', radiusMeters: 250, boundary: 'strict', boundaryToleranceMeters: 25, cohort: 'all', capacity: 5, strategy: 'marginal' };

export function runWifiGeographicScenario(snapshot: GeographicSnapshot, settings: GeographicScenarioSettings): GeographicScenario {
  if (!['verified-only','assumption-tested'].includes(settings.evidence) || ![100,250,500].includes(settings.radiusMeters) || !['strict','flagged'].includes(settings.boundary) || ![10,25,50].includes(settings.boundaryToleranceMeters) || !['B','C','D','all'].includes(settings.cohort) || ![5,10,'all'].includes(settings.capacity) || !['marginal','representation'].includes(settings.strategy)) throw new Error('Unsupported geographic scenario.');
  const exclusionReasons: Record<string,number> = {};
  const reason = (f: GeographicFacility) => settings.cohort !== 'all' && f.source !== settings.cohort ? 'source-cohort' : !f.identityQualified ? 'unqualified-identity' : f.evidenceTier === 'unresolved' ? 'unresolved-coordinate' : settings.evidence === 'verified-only' && f.evidenceTier !== 'verified' ? 'assumed-crs-excluded' : f.longitude === null || f.latitude === null ? 'invalid-coordinate' : !['interior','boundary'].includes(f.spatial.status) || !f.spatial.district ? 'unresolved-polygon-membership' : settings.boundary === 'strict' && (f.spatial.status !== 'interior' || f.spatial.distanceToBoundaryMeters === null || f.spatial.distanceToBoundaryMeters <= settings.boundaryToleranceMeters) ? 'boundary-uncertainty' : f.exclusionReasons.length ? f.exclusionReasons[0] : null;
  const eligible = snapshot.facilities.filter(f => { const r = reason(f); if (r) exclusionReasons[r]=(exclusionReasons[r]??0)+1; return !r; }).sort((a,b)=>lexical(a.id,b.id));
  const index = new Map(snapshot.distances.facilityIds.map((id,i)=>[id,i]));
  const nearest = (id: string) => settings.boundary==='strict' ? snapshot.distances.nearestHotspot[id].strictByTolerance[String(settings.boundaryToleranceMeters) as '10'|'25'|'50'] : snapshot.distances.nearestHotspot[id].flagged;
  const baseline = eligible.filter(f=>{const n=nearest(f.id);return n.distanceMeters!==null && n.distanceMeters <= settings.radiusMeters;}).map(f=>f.id);
  const counted = new Set(baseline), selectedIds: string[] = [], selections: GeographicSelection[] = [], districtCounts = new Map<string,number>();
  const associations = (f: GeographicFacility) => eligible.filter(r=>snapshot.distances.facilityMeters[index.get(f.id)!][index.get(r.id)!] <= settings.radiusMeters);
  const gain = (f: GeographicFacility) => associations(f).filter(r=>!counted.has(r.id));
  const hasAdditional = eligible.some(f=>gain(f).some(r=>r.id!==f.id));
  const limit = settings.capacity === 'all' ? eligible.length : Math.min(settings.capacity,eligible.length);
  const optimizationUnavailableReasons = !eligible.length ? ['empty-eligible-cohort'] : !hasAdditional ? ['no-additional-nonself-reference-gain'] : settings.capacity === 'all' || limit === eligible.length ? ['all-eligible-selection-has-no-capacity-tradeoff'] : [];
  const optimizationAvailable = !optimizationUnavailableReasons.length;
  while (selectedIds.length < limit) {
    const remaining = eligible.filter(f=>!selectedIds.includes(f.id));
    remaining.sort((a,b)=>{
      if (settings.strategy==='representation') {const d=(districtCounts.get(a.spatial.district!)??0)-(districtCounts.get(b.spatial.district!)??0); if(d)return d;}
      if (!optimizationAvailable) return lexical(a.id,b.id);
      // Additional references are the objective. Own-record association is separately disclosed.
      const additional=(f: GeographicFacility)=>gain(f).filter(r=>r.id!==f.id).length;
      return additional(b)-additional(a)||lexical(a.id,b.id);
    });
    const chosen=remaining[0], newly=gain(chosen), selfContribution=newly.some(r=>r.id===chosen.id)?1:0;
    selections.push({id:chosen.id,order:selections.length+1,reason:settings.strategy==='representation'?'district-representation':optimizationAvailable&&newly.length>selfContribution?'marginal-additional-reference':'descriptive-stable-order',selfContribution,additionalContribution:newly.length-selfContribution,totalContribution:newly.length,newlyAssociatedReferenceIds:newly.map(r=>r.id),nearestHotspot:nearest(chosen.id)});
    selectedIds.push(chosen.id); newly.forEach(r=>counted.add(r.id)); districtCounts.set(chosen.spatial.district!,(districtCounts.get(chosen.spatial.district!)??0)+1);
  }
  const selected=selectedIds.map(id=>eligible.find(f=>f.id===id)!);
  const incrementalReferenceIds=eligible.filter(f=>counted.has(f.id)&&!baseline.includes(f.id)).map(f=>f.id);
  return {snapshotId:snapshot.snapshotId,geometryVersion:snapshot.geometry.version,methodVersion:snapshot.methodVersion,settings:{...settings},candidatePopulation:snapshot.facilities.length,eligibleCount:eligible.length,excludedCount:snapshot.facilities.length-eligible.length,exclusionReasons,referenceDenominator:eligible.length,baselineProximateIds:baseline,baselineProximityCount:baseline.length,selectedIds,selected,selections,capacityUsed:selected.length,incrementalReferenceIds,incrementalReferenceCount:incrementalReferenceIds.length,additionalNonSelfCount:selections.reduce((s,c)=>s+c.additionalContribution,0),optimizationAvailable,optimizationUnavailableReasons,districts:[...new Set(selected.map(f=>f.spatial.district!))].sort(lexical),categories:[...new Set(selected.map(f=>f.source))].sort(lexical),assumptions:[...snapshot.assumptions,'Candidate and reference sets are the same within-edition facility-record cohort (C = R); own-record proximity is separately counted.','10/25/50 m boundary tolerances and 100/250/500 m distances are research parameters, not accuracy or radio coverage guarantees.'],unavailableMetrics:['Actual wireless coverage','Internet access or service improvement','Facility operation or installation suitability','Population demand or digital inclusion']};
}

export function compareWifiGeographicScenarios(a: GeographicScenario,b: GeographicScenario) {
  if(a.snapshotId!==b.snapshotId||a.geometryVersion!==b.geometryVersion||a.methodVersion!==b.methodVersion)throw new Error('Geographic source/geometry version mismatch.');
  const left=new Set(a.selectedIds),right=new Set(b.selectedIds);
  return {added:b.selectedIds.filter(id=>!left.has(id)),removed:a.selectedIds.filter(id=>!right.has(id)),shared:a.selectedIds.filter(id=>right.has(id)),denominatorChange:b.referenceDenominator-a.referenceDenominator,baselineProximityChange:b.baselineProximityCount-a.baselineProximityCount,incrementalReferenceChange:b.incrementalReferenceCount-a.incrementalReferenceCount,districtChange:b.districts.length-a.districts.length,categoryChange:b.categories.length-a.categories.length,assumedCrsDependent:a.settings.evidence!==b.settings.evidence};
}
