import { readFile, mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditInventory, countValues, lexical, parsePolicyCsv, readVerifiedSources, sha256, sourceScope, validWgs84 } from './auditWifiPolicySources.js';
import { normalizeArea } from '../src/lib/wifi.js';
import type { PolicyCandidate, PolicySourceEdition, WifiPolicySnapshot } from '../src/types/wifiPolicy.js';
import { validateWifiPolicySnapshot } from '../src/lib/wifiPolicy.js';

type Row = Record<string,string>;
const pairKey = (r: Row) => JSON.stringify([r.SITE_ID,r.HOTSPOT_ID]);
const canonical = (r: Row) => JSON.stringify(Object.fromEntries(Object.entries(r).sort(([a],[b])=>lexical(a,b))));
const coordinatesChanged=(a:Row,b:Row)=>Number(a.LATITUDE)!==Number(b.LATITUDE)||Number(a.LONGITUDE)!==Number(b.LONGITUDE);
function indexRows(rows: Row[]) {const map=new Map<string,Row[]>();for(const row of rows){const key=pairKey(row);map.set(key,[...(map.get(key)??[]),row]);}return map;}
export function buildSnapshot(current: Row[], legacy: Row[], editions: PolicySourceEdition[]): WifiPolicySnapshot {
  const newer=indexRows(current),older=indexRows(legacy);
  const currentSites=countValues(current.map(r=>r.SITE_ID)),currentHotspots=countValues(current.map(r=>r.HOTSPOT_ID));
  const legacySites=countValues(legacy.map(r=>r.SITE_ID)),legacyHotspots=countValues(legacy.map(r=>r.HOTSPOT_ID));
  let added=0,removed=0,changedCoordinates=0,changedCategories=0,changedMetadata=0,ambiguous=0;
  for(const [key,rows]of newer) {
    const previous=older.get(key);
    if(rows.length!==1 || previous && previous.length!==1 || !rows[0].SITE_ID || !rows[0].HOTSPOT_ID){ambiguous+=rows.length;continue;}
    if(!previous){added++;continue;}
    const row=rows[0],old=previous[0];
    if(coordinatesChanged(row,old))changedCoordinates++;
    if(row.STYPE!==old.STYPE)changedCategories++;
    if(Object.keys(row).some(k=>!['LATITUDE','LONGITUDE','STYPE'].includes(k)&&row[k]!==old[k]))changedMetadata++;
  }
  for(const [key,rows]of older)if(!newer.has(key))removed+=rows.length;
  const candidates:PolicyCandidate[]=[];
  const make=(row:Row,stale:boolean,edition:string,counts:Map<string,Row[]>)=>{
    const key=pairKey(row),same=counts.get(key)!;
    const identityVerified=!!row.SITE_ID&&!!row.HOTSPOT_ID&&same.length===1;
    const old=older.get(key),issues:string[]=[];
    if(!identityVerified)issues.push('ambiguous-source-identity');
    if(!validWgs84(row.LONGITUDE,row.LATITUDE))issues.push('invalid-wgs84-coordinate');
    if(stale)issues.push('no-current-counterpart');
    if(!stale&&old?.length===1&&coordinatesChanged(old[0],row))issues.push('changed-coordinates');
    if(!stale&&!old)issues.push('new-source-relationship');
    if(!stale&&old&&old.length!==1)issues.push('ambiguous-legacy-relationship');
    if((stale?legacySites:currentSites)[row.SITE_ID]>1)issues.push('duplicate-site-id');
    if((stale?legacyHotspots:currentHotspots)[row.HOTSPOT_ID]>1)issues.push('duplicate-hotspot-id');
    if(sourceScope(row)!=='taipei-source')issues.push('outside-or-unresolved-source-scope');
    if(!row.AGENCY||!row.VENDOR_ID)issues.push('missing-attribution');
    if(!row.STYPE||!row.AREA||!row.NAME)issues.push('missing-documentation');
    if(!stale&&old?.length===1&&old[0].STYPE!==row.STYPE)issues.push('changed-category');
    if(!stale&&old?.length===1&&Object.keys(row).some(k=>!['LATITUDE','LONGITUDE','STYPE'].includes(k)&&row[k]!==old[0][k]))issues.push('source-metadata-changed');
    if(!issues.length)issues.push('boundary-and-operation-unverified');
    const primary=['ambiguous-source-identity','invalid-wgs84-coordinate','no-current-counterpart','changed-coordinates','new-source-relationship','ambiguous-legacy-relationship'];
    const tier=issues.some(i=>primary.includes(i))?'A':issues.some(i=>i!=='boundary-and-operation-unverified')?'B':'C';
    const valid=validWgs84(row.LONGITUDE,row.LATITUDE);
    candidates.push({id:`A:${edition}:${encodeURIComponent(row.SITE_ID||'_')}:${encodeURIComponent(row.HOTSPOT_ID||'_')}:${sha256(canonical(row)).slice(0,16)}`,
      siteId:row.SITE_ID,hotspotId:row.HOTSPOT_ID,name:row.NAME,district:normalizeArea(row.AREA),category:row.STYPE||'(missing)',
      nameEn:row.E_NAME||undefined,districtEn:row.E_AREA||undefined,categoryEn:row.E_STYPE||undefined,
      latitude:valid?Number(row.LATITUDE):null,longitude:valid?Number(row.LONGITUDE):null,tier,issues,identityVerified,stale,sourceEdition:edition,scope:sourceScope(row)});
  };
  const currentEdition=editions.find(e=>e.id==='A')!.sha256!;
  for(const row of current)make(row,false,currentEdition,newer);
  for(const [key,rows]of older)if(!newer.has(key))for(const row of rows)make(row,true,editions.find(e=>e.id==='A-legacy')!.sha256!,older);
  // Exact duplicate records are retained with deterministic occurrence suffixes.
  candidates.sort((a,b)=>lexical(a.id,b.id));const occurrences=new Map<string,number>();
  for(const candidate of candidates){const id=candidate.id,n=(occurrences.get(id)??0)+1;occurrences.set(id,n);candidate.id=`${id}:${n}`;}
  const snapshot:WifiPolicySnapshot={schemaVersion:1,snapshotId:'',methodVersion:'wifi-allocation-evidence-review-v1',candidateGrain:'Source edition + SITE_ID + HOTSPOT_ID + canonical row SHA-256 prefix + duplicate occurrence',sourceEditions:editions,
    reconciliation:{identityRule:'Exact unique SITE_ID + HOTSPOT_ID pairs only; no name joins. Changes describe published records, not physical events.',legacy:auditInventory(legacy),current:auditInventory(current),added,removed,changedCoordinates,changedCategories,changedMetadata,ambiguous},
    summary:{candidates:candidates.length,byTier:countValues(candidates.map(c=>c.tier)),byIssue:countValues(candidates.flatMap(c=>c.issues))},candidates,
    modes:{A:{available:true,reasons:['Published source rows support evidence investigation.'],requirements:[]},B:{available:false,reasons:['Facility sources B/D have no publisher facility IDs or authoritative CRS/datum/precision contract; C projected X/Y semantics require validation.','Official TWD97 district polygons are retained but reprojection/spatial attribution is not validated.'],requirements:['Accepted official facility identity and coordinate contract','Validated district attribution and eligible reference population']},C:{available:false,reasons:['No accepted site-level operational, quality, usage, population or demand evidence.'],requirements:['Operational identity continuity','Comparable time windows','Validated service/demand denominators']}},
    assumptions:['Published Taipei county/district fields establish source administrative labels only; they do not establish polygon membership.','Tier precedence: A primary identity/version/coordinate verification, then B documentation, then C monitoring.','Investigation slots are not equipment allocation approvals.'],
    limitations:['No RF coverage, uptime, speed, demand or digital exclusion is measured.','Acquisition time for the legacy source is unknown; filesystem timestamps are not retrieval evidence.','Source edition changes are not proof of installations or removals.','All rows are retained; broader scope admits records for investigation without certifying their coordinates.']};
  snapshot.snapshotId=`wifi-policy-${sha256(JSON.stringify(snapshot)).slice(0,24)}`;return snapshot;
}
export function validateSnapshot(value: WifiPolicySnapshot) {
  validateWifiPolicySnapshot(value);
  if(value.schemaVersion!==1||!value.candidates.length||value.summary.candidates!==value.candidates.length||new Set(value.candidates.map(c=>c.id)).size!==value.candidates.length)throw new Error('Invalid policy snapshot schema/identity.');
  for(const c of value.candidates)if(!['A','B','C'].includes(c.tier)||!c.issues.length||!c.id||!c.sourceEdition||!Array.isArray(c.issues))throw new Error('Invalid candidate schema.');
  const copy={...value,snapshotId:''};if(value.snapshotId!==`wifi-policy-${sha256(JSON.stringify(copy)).slice(0,24)}`)throw new Error('Snapshot content hash mismatch.');
}
export async function publishSnapshot(snapshot:WifiPolicySnapshot, directory='public/data/wifi-policy') {
  validateSnapshot(snapshot);await mkdir(directory,{recursive:true});const text=JSON.stringify(snapshot);const immutable=path.join(directory,`${snapshot.snapshotId}.json`);
  try {await writeFile(immutable,text,{flag:'wx'});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;if(await readFile(immutable,'utf8')!==text)throw new Error('Immutable edition collision.');}
  const temporary=path.join(directory,`.snapshot-${process.pid}.tmp`);
  try {await writeFile(temporary,text);JSON.parse(await readFile(temporary,'utf8'));await rename(temporary,path.join(directory,'snapshot.json'));}finally{await unlink(temporary).catch(()=>{});}
  return {snapshotId:snapshot.snapshotId,sha256:sha256(text),bytes:Buffer.byteLength(text)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const manifest=await readVerifiedSources();const a=manifest.sources.find((s:{id:string})=>s.id==='A');if(a?.status!=='acquired'||!a.path.endsWith('.csv'))throw new Error('Current validated CSV unavailable; preserving last good snapshot.');
  const legacyPath='data/raw/wifi-hotspots/Taipei_Free_AP_總表1141218.csv',legacyBytes=await readFile(legacyPath);
  const editions:PolicySourceEdition[]=manifest.sources.map((s:PolicySourceEdition)=>({id:s.id,datasetId:s.datasetId,resourceId:s.resourceId,catalogueUrl:s.catalogueUrl,url:s.url,publishedAt:s.publishedAt,retrievedAt:s.retrievedAt,retrievalDate:s.retrievalDate,retrievalPrecision:s.retrievalPrecision,publisher:s.publisher,license:s.license,eligibility:s.eligibility,exclusionReasons:s.exclusionReasons,status:s.status,sha256:s.sha256,bytes:s.bytes}));
  editions.push({id:'A-legacy',datasetId:a.datasetId,resourceId:a.resourceId,catalogueUrl:a.catalogueUrl,url:a.url,publishedAt:null,retrievedAt:null,status:'retained-legacy',sha256:sha256(legacyBytes),bytes:legacyBytes.length,notes:['Filename contains 1141218; this is not independently validated publication or retrieval evidence.']});
  console.log(JSON.stringify(await publishSnapshot(buildSnapshot(parsePolicyCsv(await readFile(a.path)),parsePolicyCsv(legacyBytes),editions))));
}
