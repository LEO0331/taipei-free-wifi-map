import type { GeographicManifest, GeographicScenario, GeographicSnapshot } from '../types/wifiGeographicPolicy.js';

export const GEOGRAPHIC_RESPONSIBLE_USE = 'Experimental geometric research only. CRS assumptions and distance parameters do not establish radio coverage, connectivity, resident access, demand, installation suitability or authorization.';

export function validateGeographicManifest(value: unknown): asserts value is GeographicManifest {
  const m = value as GeographicManifest;
  if (!m || m.schemaVersion !== '1.1' || !/^wifi-geo-[a-f0-9]{24}$/.test(m.versionId) || m.methodVersion !== 'wifi-geographic-proximity-experiment-v1' || !m.artifacts) throw new Error('Invalid geographic manifest');
  for (const name of ['snapshot.json','boundaries.geojson','coordinate-audit.json','hotspot-audit.json','references.json','excluded.json']) {
    const a = m.artifacts[name];
    if (!a || a.path !== `${m.versionId}/${name}` || !/^[a-f0-9]{64}$/.test(a.sha256) || !Number.isSafeInteger(a.bytes) || a.bytes <= 0 || a.bytes > 25_000_000) throw new Error('Invalid geographic artifact path/hash/size');
  }
}

export function validateGeographicSnapshot(value: unknown): asserts value is GeographicSnapshot {
  const s = value as GeographicSnapshot;
  if (!s || s.schemaVersion !== '1.1' || s.methodVersion !== 'wifi-geographic-proximity-experiment-v1' || s.baselineSnapshot?.id !== 'wifi-policy-c250791e7736ed5bca2882ea' || s.baselineSnapshot.sha256 !== '91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82' || s.modeC?.available !== false || !Array.isArray(s.facilities) || !Array.isArray(s.sourceEditions) || !Array.isArray(s.assumptions) || s.transform?.source !== 'EPSG:3826' || s.transform.target !== 'EPSG:4326') throw new Error('Invalid geographic snapshot');
  const ids = new Set<string>();
  if(!/^wifi-geo-[a-f0-9]{24}$/.test(s.versionId)) throw new Error('Invalid snapshot version');
  if(s.sourceEditions.length!==5 || new Set(s.sourceEditions.map(source=>source.id)).size!==5 || !['A','B','C','D','E'].every(id=>s.sourceEditions.some(source=>source.id===id))) throw new Error('Invalid source population');
  for(const source of s.sourceEditions) {
    const url=new URL(source.catalogueUrl);
    if(url.protocol!=='https:' || url.hostname!=='data.taipei' || url.username || url.password || !/^[a-f0-9]{64}$/.test(source.sha256)) throw new Error('Invalid source lineage');
  }
  for (const f of s.facilities) {
    if (!f || typeof f.id !== 'string' || ids.has(f.id) || !['B','C','D'].includes(f.source) || !['verified','assumption-tested','unresolved'].includes(f.tier) || typeof f.eligible !== 'boolean' || f.tier === 'unresolved' && f.eligible || !s.sourceEditions.some(source=>source.id===f.source && source.sha256===f.sourceHash) || !Array.isArray(f.neighbors) || !Array.isArray(f.issues) || !f.spatial || !['strict','flagged'].every(k=>{const n=f.nearestHotspotMeters?.[k as 'strict'];return n===null || typeof n==='number' && Number.isFinite(n) && n>=0;})) throw new Error('Invalid facility evidence');
    if (f.eligible && (typeof f.longitude !== 'number' || typeof f.latitude !== 'number' || !Number.isFinite(f.longitude) || !Number.isFinite(f.latitude) || Math.abs(f.longitude)>180 || Math.abs(f.latitude)>90 || !['interior','boundary-adjacent'].includes(f.spatial.status) || f.spatial.agrees !== true)) throw new Error('Invalid eligible facility');
    const source=s.sourceEditions.find(source=>source.id===f.source)!;
    if(new Set(f.neighbors.map(n=>n.id)).size!==f.neighbors.length || f.tier==='verified' && !f.declaredCRS) throw new Error('Duplicate associations or unsupported verified tier');
    if(f.sourceUrl!==source.catalogueUrl || f.sourceFile!==source.path || typeof f.name!=='string' || typeof f.address!=='string' || !f.issues.every(issue=>typeof issue==='string') || !f.spatial.matches.every(d=>typeof d==='string')) throw new Error('Facility source mismatch');
    ids.add(f.id);
  }
  for (const f of s.facilities) for (const n of f.neighbors) if (!ids.has(n.id) || !Number.isFinite(n.meters) || n.meters<0 || n.meters>500) throw new Error('Invalid association');
}

export async function checkedGeographicJson(response: Response, descriptor: {bytes: number;sha256: string}): Promise<unknown> {
  if (!response.ok) throw new Error('Artifact fetch failed');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== descriptor.bytes) throw new Error('Artifact size mismatch');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
  if (hash !== descriptor.sha256) throw new Error('Artifact hash mismatch');
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}

export function geographicExport(snapshot: GeographicSnapshot, manifest: GeographicManifest, scenario: GeographicScenario) {
  if (snapshot.versionId !== manifest.versionId || manifest.versionId !== scenario.versionId || snapshot.methodVersion !== scenario.methodVersion) throw new Error('Export version mismatch');
  return {policyVersion:'8-v1.1',manifest,baselineSnapshot:snapshot.baselineSnapshot,sourceEditions:snapshot.sourceEditions,
    transform:snapshot.transform,geometryEdition:snapshot.geometryEdition,referenceUnit:snapshot.referenceUnit,scenario,
    selected:scenario.selected.map(selection=>({selection,facility:snapshot.facilities.find(f=>f.id===selection.id)})),
    assumptions:snapshot.assumptions,responsibleUse:GEOGRAPHIC_RESPONSIBLE_USE,operationalRequirements:snapshot.modeC.requirements};
}

export function geographicCsv(snapshot: GeographicSnapshot, manifest: GeographicManifest, scenario: GeographicScenario) {
  const record = geographicExport(snapshot,manifest,scenario);
  const cell = (value: unknown) => {let s=typeof value==='string'?value:JSON.stringify(value);if (/^[\s\uFEFF]*[=+\-@]/.test(s)) s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  const rows: unknown[][] = [['record_type','id','source','name','coordinate_evidence','original_coordinates','assumed_crs','longitude','latitude','source_district','polygon_district','spatial_status','nearest_hotspot_m','own_reference','additional_references','marginal_references','lineage_and_scenario'],
    ['metadata','','','','','','','','','','','','','','','',record]];
  for (const {selection,facility:f} of record.selected) if (f) rows.push(['facility',f.id,f.source,f.name,f.tier,f.originalCoordinates,f.declaredCRS??f.assumedCRS,f.longitude,f.latitude,f.sourceDistrict,f.spatial.district,f.spatial.status,f.nearestHotspotMeters[scenario.settings.geography],selection.ownReference,selection.additionalReferences,selection.marginalReferences,{sourceHash:f.sourceHash,sourceRow:f.sourceRow,sourceFile:f.sourceFile,issues:f.issues,selectionReason:selection.reason}]);
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
