import type { GeographicScenario, GeographicSnapshot } from '../types/wifiGeographicPolicy.js';
import { isOfficialWifiSourceUrl, safePolicyCsvCell } from './wifiPolicy.js';
export const GEOGRAPHIC_DISCLAIMER = 'Experimental geometric research only. Proximity is not radio coverage, internet access, population benefit, facility suitability, or municipal installation authorization.';
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(s=>typeof s==='string');
const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function validateWifiGeographicSnapshot(value: unknown): asserts value is GeographicSnapshot {
  const fail=()=>{throw new Error('Invalid or incompatible geographic snapshot.');};
  if(!record(value)||value.schemaVersion!==1||value.methodVersion!=='wifi-geographic-proximity-experiment-v1'||typeof value.snapshotId!=='string'||!/^wifi-geographic-[a-f0-9]{24}$/.test(value.snapshotId)||!record(value.baseline)||value.baseline.snapshotId!=='wifi-policy-c250791e7736ed5bca2882ea'||value.baseline.sha256!=='91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82'||!strings(value.assumptions)||!strings(value.limitations)||value.candidateEqualsReference!==true||typeof value.referenceUnit!=='string'||!record(value.modeC)||value.modeC.available!==false||!strings(value.modeC.requirements))return fail();
  if(!record(value.geometry)||typeof value.geometry.version!=='string'||!hash(value.geometry.sha256)||!hash(value.geometry.sourceSha256)||typeof value.geometry.transformationVersion!=='string'||typeof value.geometry.file!=='string'||!/^[a-zA-Z0-9.-]+\.geojson$/.test(value.geometry.file)||value.geometry.districtCount!==12||!Array.isArray(value.sourceEditions))return fail();
  const sources=new Map<string,string>();
  for (const source of value.sourceEditions) {
    if (!record(source) || typeof source.id !== 'string' || !hash(source.sha256)
      || !isOfficialWifiSourceUrl(source.catalogueUrl) || !isOfficialWifiSourceUrl(source.url)) return fail();
    sources.set(source.id, source.sha256 as string);
  }
  if(!['A','B','C','D','E'].every(s=>sources.has(s))||sources.get('E')!==value.geometry.sourceSha256)return fail();
  const geometry=value.geometry;
  const spatial=(s:unknown)=>record(s)&&['interior','boundary','exterior','ambiguous','invalid'].includes(s.status as string)&&(s.district===null||typeof s.district==='string')&&strings(s.matches)&&(s.distanceToBoundaryMeters===null||typeof s.distanceToBoundaryMeters==='number'&&Number.isFinite(s.distanceToBoundaryMeters)&&s.distanceToBoundaryMeters>=0)&&(s.sourceDistrictAgrees===null||typeof s.sourceDistrictAgrees==='boolean')&&s.geometryVersion===geometry.version&&s.transformationVersion===geometry.transformationVersion;
  if(!Array.isArray(value.facilities)||!Array.isArray(value.hotspots)||!record(value.distances)||!strings(value.distances.facilityIds)||!Array.isArray(value.distances.facilityMeters)||!record(value.distances.nearestHotspot))return fail();
  const ids=new Set<string>();
  for(const f of value.facilities){if(!record(f)||typeof f.id!=='string'||!f.id||ids.has(f.id)||!['B','C','D'].includes(f.source as string)||f.sourceEdition!==sources.get(f.source as string)||f.sourceSha256!==f.sourceEdition||!['verified','assumption-tested','unresolved'].includes(f.evidenceTier as string)||typeof f.identityQualified!=='boolean'||!spatial(f.spatial)||!strings(f.warnings)||!strings(f.exclusionReasons)||!strings(f.independentEvidence)||!record(f.rawRecord)||!record(f.originalCoordinates)||!['name','address','sourceFilename','rowIdentity','sourceDistrict'].every(k=>typeof f[k]==='string')||!['x','y','xField','yField'].every(k=>typeof (f.originalCoordinates as Record<string,unknown>)[k]==='string')||![f.sourceCrs,f.assumedCrs].every(x=>x===null||typeof x==='string'))return fail();
    if(!(f.longitude===null&&f.latitude===null)&&!(typeof f.longitude==='number'&&Number.isFinite(f.longitude)&&Math.abs(f.longitude)<=180&&typeof f.latitude==='number'&&Number.isFinite(f.latitude)&&Math.abs(f.latitude)<=90))return fail();ids.add(f.id);}
  const hotspotIds=new Set<string>();
  for(const h of value.hotspots){if(!record(h)||typeof h.id!=='string'||hotspotIds.has(h.id)||!strings(h.sourceIds)||!h.sourceIds.length||typeof h.sourceDistrict!=='string'||!['taipei-source','outside-source','unresolved'].includes(h.sourceScope as string)||typeof h.longitude!=='number'||!Number.isFinite(h.longitude)||Math.abs(h.longitude)>180||typeof h.latitude!=='number'||!Number.isFinite(h.latitude)||Math.abs(h.latitude)>90||!spatial(h.spatial))return fail();hotspotIds.add(h.id);}
  const di=value.distances.facilityIds;const validIds=value.facilities.filter(f=>f.longitude!==null&&f.latitude!==null).map(f=>f.id);if(di.length!==validIds.length||new Set(di).size!==di.length||!validIds.every(id=>di.includes(id))||value.distances.facilityMeters.length!==di.length)return fail();
  for(const item of Object.values(value.distances.nearestHotspot)){if(!record(item)||!record(item.strictByTolerance)||JSON.stringify(item.strict)!==JSON.stringify(item.strictByTolerance['25']))return fail();}
  for(let i=0;i<di.length;i++){const row=value.distances.facilityMeters[i];if(!Array.isArray(row)||row.length!==di.length||!row.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0)||row[i]!==0)return fail();for(let j=0;j<i;j++)if(row[j]!==value.distances.facilityMeters[j][i])return fail();const n=value.distances.nearestHotspot[di[i]];if(!record(n)||!record(n.strictByTolerance))return fail();for(const item of [n.strict,n.flagged,...['10','25','50'].map(k=>(n.strictByTolerance as Record<string,unknown>)[k])]){if(!record(item)||!strings(item.hotspotIds)||!item.hotspotIds.every(id=>hotspotIds.has(id))||!(item.distanceMeters===null&&item.hotspotIds.length===0||typeof item.distanceMeters==='number'&&Number.isFinite(item.distanceMeters)&&item.distanceMeters>=0&&item.hotspotIds.length>0))return fail();}}
}
export function createWifiGeographicJsonExport(snapshot: GeographicSnapshot,scenario: GeographicScenario): string {
  if(snapshot.snapshotId!==scenario.snapshotId||snapshot.geometry.version!==scenario.geometryVersion)throw new Error('Geographic export version mismatch.');
  return JSON.stringify({policyVersion:'8-v1.1',methodVersion:snapshot.methodVersion,snapshotId:snapshot.snapshotId,baseline:snapshot.baseline,sourceEditions:snapshot.sourceEditions,geometry:snapshot.geometry,referenceUnit:snapshot.referenceUnit,candidateEqualsReference:true,disclaimer:GEOGRAPHIC_DISCLAIMER,limitations:snapshot.limitations,scenario,facilityAudit:snapshot.facilities,hotspotBaseline:snapshot.hotspots,distanceIndex:snapshot.distances},null,2);
}
export function createWifiGeographicCsvExport(snapshot: GeographicSnapshot,scenario: GeographicScenario): string {
  const metadata=JSON.parse(createWifiGeographicJsonExport(snapshot,scenario));metadata.scenario={...scenario,selected:[]};
  const headers=['candidate_id','source','name','address','evidence_tier','source_crs','assumed_crs','longitude','latitude','polygon_district','nearest_hotspot_meters','selection_reason','self_reference_gain','additional_reference_gain','record_audit_json','decision_metadata_json'];
  const rows: unknown[][]=scenario.selected.map((f,i)=>{const s=scenario.selections[i];return [f.id,f.source,f.name,f.address,f.evidenceTier,f.sourceCrs,f.assumedCrs,f.longitude,f.latitude,f.spatial.district,s.nearestHotspot.distanceMeters,s.reason,s.selfContribution,s.additionalContribution,JSON.stringify(f),i===0?JSON.stringify(metadata):''];});
  if(!rows.length)rows.push([...Array(15).fill(''),JSON.stringify(metadata)]);
  return '\uFEFF'+[headers,...rows].map(row=>row.map(safePolicyCsvCell).join(',')).join('\r\n');
}
