import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import type { GeographicFacility, GeographicHotspot, GeographicNearest, GeographicSnapshot } from '../src/types/wifiGeographicPolicy.js';
import { validateWifiGeographicSnapshot } from '../src/lib/wifiGeographicPolicy.js';
import { runWifiGeographicScenario } from '../src/lib/wifiGeographicScenarios.js';
import { readVerifiedSources } from './auditWifiPolicySources.js';
const hash=(x: string|Buffer)=>createHash('sha256').update(x).digest('hex');
export function haversineMeters(a: {longitude:number;latitude:number},b: {longitude:number;latitude:number}) {
  const rad=Math.PI/180,dlat=(b.latitude-a.latitude)*rad,dlon=(b.longitude-a.longitude)*rad;
  const v=Math.sin(dlat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dlon/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(v),Math.sqrt(Math.max(0,1-v)));
}
export function prepareGeographicDistances(facilities: GeographicFacility[],rows: GeographicHotspot[]) {
  const groups=new Map<string,GeographicHotspot>();
  for(const row of rows){const key=JSON.stringify([row.longitude,row.latitude,row.sourceScope,row.spatial.status,row.spatial.district]);const old=groups.get(key);if(old)old.sourceIds=[...new Set([...old.sourceIds,...row.sourceIds])].sort();else groups.set(key,{...row,sourceIds:[...row.sourceIds].sort(),id:`H:${hash(key).slice(0,24)}`});}
  const hotspots=[...groups.values()].sort((a,b)=>a.id.localeCompare(b.id));
  const valid=facilities.filter(f=>f.longitude!==null&&f.latitude!==null).sort((a,b)=>a.id.localeCompare(b.id));
  const nearestHotspot: GeographicSnapshot['distances']['nearestHotspot']={};
  for(const f of valid){const distances=hotspots.filter(h=>h.sourceScope==='taipei-source'&&['interior','boundary'].includes(h.spatial.status)&&h.spatial.district).map(h=>({h,d:haversineMeters(f as {longitude:number;latitude:number},h)}));
    const nearest=(strict:number|null):GeographicNearest=>{const eligible=distances.filter(({h})=>strict===null||h.spatial.status==='interior'&&h.spatial.distanceToBoundaryMeters!==null&&h.spatial.distanceToBoundaryMeters>strict);let min=Infinity;for(const d of eligible)min=Math.min(min,d.d);return Number.isFinite(min)?{distanceMeters:min,hotspotIds:eligible.filter(d=>Math.abs(d.d-min)<1e-9).map(d=>d.h.id).sort()}:{distanceMeters:null,hotspotIds:[]};};
    nearestHotspot[f.id]={strict:nearest(25),flagged:nearest(null),strictByTolerance:{'10':nearest(10),'25':nearest(25),'50':nearest(50)}};
  }
  const facilityMeters=valid.map(a=>valid.map(b=>haversineMeters(a as {longitude:number;latitude:number},b as {longitude:number;latitude:number})));
  // Invalid coordinates remain in the audit, outside the numerical distance index.
  return {hotspots,distances:{facilityIds:valid.map(f=>f.id),facilityMeters,nearestHotspot}};
}
export async function publishGeographicSnapshot(snapshot: GeographicSnapshot,directory='public/data/wifi-policy/geographic-v1.1') {
  validateWifiGeographicSnapshot(snapshot);const text=JSON.stringify(snapshot),sha256=hash(text),snapshotFile=`${snapshot.snapshotId}.json`;
  if(snapshot.snapshotId!==`wifi-geographic-${hash(JSON.stringify({...snapshot,snapshotId:''})).slice(0,24)}`)throw new Error('Geographic content identity mismatch.');
  if(hash(await readFile(path.join(directory,snapshot.geometry.file)))!==snapshot.geometry.sha256)throw new Error('Published geometry hash mismatch; preserving last good manifest.');
  await mkdir(directory,{recursive:true});const immutable=path.join(directory,snapshotFile);
  try{await writeFile(immutable,text,{flag:'wx'});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;if(await readFile(immutable,'utf8')!==text)throw new Error('Geographic immutable collision.');}
  const manifest={schemaVersion:1,methodVersion:snapshot.methodVersion,snapshotId:snapshot.snapshotId,snapshotFile,sha256,bytes:Buffer.byteLength(text),geometryFile:snapshot.geometry.file,geometrySha256:snapshot.geometry.sha256};
  const temp=path.join(directory,`.manifest-${process.pid}.tmp`);
  try{await writeFile(temp,JSON.stringify(manifest));JSON.parse(await readFile(temp,'utf8'));await rename(temp,path.join(directory,'manifest.json'));}finally{await unlink(temp).catch(()=>{});}
  return manifest;
}
export async function buildGeographicSnapshot(directory='public/data/wifi-policy/geographic-v1.1') {
  const acquisition=await readVerifiedSources(),audit=JSON.parse(await readFile(path.join(directory,'facilities-audit.json'),'utf8')),hotspotAudit=JSON.parse(await readFile(path.join(directory,'hotspots-audit.json'),'utf8'));
  const geometryBytes=await readFile(path.join(directory,'district-boundaries.geojson')),geometry=JSON.parse(geometryBytes.toString()),geometrySha=hash(geometryBytes);
  const sourceEditions=acquisition.sources.filter((s:{id:string})=>['A','B','C','D','E'].includes(s.id));
  const e=sourceEditions.find((s:{id:string})=>s.id==='E');
  if(hotspotAudit.sourceSha256!==sourceEditions.find((s:{id:string})=>s.id==='A').sha256)throw new Error('Hotspot source version mismatch.');
  const geometryFile=`district-boundaries-${geometrySha.slice(0,24)}.geojson`;
  try{await writeFile(path.join(directory,geometryFile),geometryBytes,{flag:'wx'});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;if(hash(await readFile(path.join(directory,geometryFile)))!==geometrySha)throw new Error('Immutable geometry collision.');}
  const version=`taipei-districts-${geometrySha.slice(0,24)}`,transformationVersion='proj-twd97-wgs84-always-xy-v1';
  const facilities:GeographicFacility[]=audit.records;
  if(audit.geometrySha256!==geometrySha||hotspotAudit.geometrySha256!==geometrySha)throw new Error('Geographic audit geometry version mismatch.');
  for(const f of facilities){const source=sourceEditions.find((s:{id:string})=>s.id===f.source);if(!source||source.sha256!==f.sourceSha256||f.sourceEdition!==source.sha256||f.spatial.geometryVersion!==version||f.spatial.transformationVersion!==transformationVersion)throw new Error('Facility source/geometry version mismatch.');}
  const normalize=(spatial:GeographicFacility['spatial'])=>({...spatial,geometryVersion:version,transformationVersion});
  facilities.forEach(f=>{f.spatial=normalize(f.spatial);});
  const rows:GeographicHotspot[]=hotspotAudit.records;rows.forEach(h=>{if(h.spatial.geometryVersion!==version||h.spatial.transformationVersion!==transformationVersion)throw new Error('Hotspot geometry version mismatch.');h.spatial=normalize(h.spatial);});
  const prepared=prepareGeographicDistances(facilities,rows);
  const baselineBytes=await readFile('public/data/wifi-policy/wifi-policy-c250791e7736ed5bca2882ea.json');
  if(hash(baselineBytes)!=='91b28d7b375e7fb14ee42bfbe179d792c9e0ed0992f273582dd1e03e6bac8a82')throw new Error('Historical Mode A bytes changed.');
  const snapshot:GeographicSnapshot={schemaVersion:1,snapshotId:'',methodVersion:'wifi-geographic-proximity-experiment-v1',baseline:{snapshotId:'wifi-policy-c250791e7736ed5bca2882ea',sha256:hash(baselineBytes)},sourceEditions,geometry:{version,sha256:geometrySha,file:geometryFile,sourceSha256:e.sha256,transformationVersion,districtCount:geometry.features.length},facilities,...prepared,summary:{records:facilities.length,verified:facilities.filter(f=>f.evidenceTier==='verified').length,assumptionTested:facilities.filter(f=>f.evidenceTier==='assumption-tested').length,unresolved:facilities.filter(f=>f.evidenceTier==='unresolved').length,hotspotRows:rows.length,hotspotCoordinateLocations:prepared.hotspots.length},referenceUnit:'Unique within-edition source-specific name/address research composite; not verified distinct physical sites',candidateEqualsReference:true,modeC:{available:false,requirements:['Site operation and quality evidence','Comparable population and demand denominators']},assumptions:['Facility CRS assumptions remain assumptions after geometric checks.','H contains source-labelled Taipei published hotspot coordinates with accepted polygon attribution; duplicate coordinate locations are consolidated with all source IDs retained.','C = R: hypothetical field-review candidates equal the qualified within-edition reference facility cohort.','No demand weights. Distances use spherical Haversine with mean Earth radius 6371008.8 m; thresholds are analytical only.'],limitations:['Neither original facility positional accuracy nor current operation is established.','Historical boundaries are not evidence of current administrative currency.','Cross-source facilities are not automatically deduplicated; reference counts are records, not physical-site or population counts.','Selecting all records or own-record proximity cannot substantiate an optimization conclusion.']};
  snapshot.snapshotId=`wifi-geographic-${hash(JSON.stringify(snapshot)).slice(0,24)}`;
  const scenarios=[];
  for(const evidence of ['verified-only','assumption-tested'] as const)for(const radiusMeters of [100,250,500] as const)for(const boundary of ['strict','flagged'] as const)for(const boundaryToleranceMeters of [10,25,50] as const)for(const cohort of ['B','C','D','all'] as const)for(const capacity of [5,10,'all'] as const)for(const strategy of ['marginal','representation'] as const)scenarios.push(runWifiGeographicScenario(snapshot,{evidence,radiusMeters,boundary,boundaryToleranceMeters,cohort,capacity,strategy}));
  validateWifiGeographicSnapshot(snapshot);
  const summaryText=JSON.stringify({snapshotId:snapshot.snapshotId,scenarios:scenarios.map(({selected,assumptions,unavailableMetrics,...s})=>({...s,selectedIds:selected.map(f=>f.id)}))});
  const summaryTemp=path.join(directory,`.scenarios-${process.pid}.tmp`);
  try{await writeFile(summaryTemp,summaryText);await rename(summaryTemp,path.join(directory,'scenario-summaries.json'));}finally{await unlink(summaryTemp).catch(()=>{});}
  return publishGeographicSnapshot(snapshot,directory);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)console.log(JSON.stringify(await buildGeographicSnapshot()));
