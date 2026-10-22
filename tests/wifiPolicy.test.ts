import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { auditInventory, countValues, parsePolicyCsv, REQUIRED_COLUMNS, sha256, sourceScope, validWgs84, readVerifiedSources } from '../scripts/auditWifiPolicySources.js';
import { buildSnapshot, publishSnapshot, validateSnapshot } from '../scripts/buildWifiPolicySnapshot.js';
import { fetchOfficialBytes, validateFetchUrl } from '../scripts/fetchWifiPolicySources.js';
import { runWifiPolicyScenario, compareWifiPolicyScenarios } from '../src/lib/wifiPolicyScenarios.js';
import { createWifiPolicyJsonExport, createWifiPolicyCsvExport, safePolicyCsvCell, validateWifiPolicySnapshot } from '../src/lib/wifiPolicy.js';
import { calculateDistanceMeters } from '../src/lib/wifi.js';
import type { PolicySourceEdition, WifiPolicySnapshot } from '../src/types/wifiPolicy.js';

const row=(id='1',extra:Record<string,string>={}):Record<string,string>=>({SITE_ID:id,HOTSPOT_ID:id,NAME:'Official location',STYPE:'圖書館',AREA:'中正區',county:'臺北市',LATITUDE:'25.03',LONGITUDE:'121.52',AGENCY:'agency',VENDOR_ID:'vendor',...extra});
const edition=(id:string):PolicySourceEdition=>({id,datasetId:'dataset',resourceId:null,catalogueUrl:'https://data.taipei',url:'https://data.taipei',publishedAt:null,retrievedAt:null,status:'retained',sha256:sha256(id),bytes:1});
const editions=[edition('A'),edition('A-legacy')];
const settings={capacity:5 as const,strategy:'evidence' as const,eligibility:'strict' as const,includeStale:false};

test('strict CSV handles BOM/reordered columns and rejects malformed, empty, missing, duplicate and bad encoding',()=>{
  const headers=[...REQUIRED_COLUMNS].reverse();const csv=headers.join(',')+'\r\n'+headers.map(h=>row()[h]??'').join(',');
  assert.equal(parsePolicyCsv(Buffer.from('\uFEFF'+csv))[0].SITE_ID,'1');
  for(const text of ['',REQUIRED_COLUMNS.join(','),'SITE_ID\na','SITE_ID,SITE_ID\na,b',csv+'\nshort',csv+'\n"unclosed',csv+'\n"a"oops'])assert.throws(()=>parsePolicyCsv(Buffer.from(text)));
  assert.throws(()=>parsePolicyCsv(Uint8Array.from([0xff,0xfe])));
  const quoted=REQUIRED_COLUMNS.join(',')+'\n'+REQUIRED_COLUMNS.map(h=>h==='NAME'?'"a, b ""quoted"""':row()[h]??'').join(',');
  assert.equal(parsePolicyCsv(Buffer.from(quoted))[0].NAME,'a, b "quoted"');
  assert.throws(()=>parsePolicyCsv(Buffer.from(REQUIRED_COLUMNS.join(',')+',NEW_COLUMN\n'+REQUIRED_COLUMNS.map(h=>row()[h]??'').join(',')+',value')));
});
test('WGS84 contract rejects projected CRS and nonnumeric values; scope uses published labels, never broad bounds',()=>{
  assert.ok(validWgs84('121.52','25.03'));for(const [lon,lat]of [[300625,2770374],[null,null],['',''],[true,false],['bad','25'],[181,25]])assert.equal(validWgs84(lon,lat),false);
  assert.equal(sourceScope(row('1',{county:'新北市',AREA:'板橋區'})),'outside-source');
  assert.equal(sourceScope(row('1',{county:'',AREA:'中正區'})),'unresolved');
  assert.equal(calculateDistanceMeters(25,121,25,121),0);assert.ok(Math.abs(calculateDistanceMeters(0,0,0,1)-111194.9266)<0.01);
  assert.equal(countValues(['__proto__','constructor','__proto__']).__proto__,2);
});
test('identity collisions preserve rows, tier precedence, numeric coordinate reconciliation and stable reorder',()=>{
  const old=[row('1'),row('2'),row('gone')];const current=[row('1',{LATITUDE:'25.03000'}),row('2',{LATITUDE:'25.04'}),row('new'),row('dup'),row('dup'),row('',{NAME:'Missing identity'}),row('out',{county:'新北市',AREA:'板橋區'})];
  const snapshot=buildSnapshot(current,old,editions);
  assert.equal(snapshot.reconciliation.changedCoordinates,1);assert.equal(snapshot.reconciliation.removed,1);
  assert.equal(snapshot.candidates.find(c=>c.siteId==='2')?.tier,'A');assert.equal(snapshot.candidates.find(c=>c.siteId==='gone')?.stale,true);
  assert.equal(new Set(snapshot.candidates.map(c=>c.id)).size,snapshot.candidates.length);
  assert.equal(buildSnapshot([...current].reverse(),old,editions).snapshotId,snapshot.snapshotId);
  const audit=auditInventory(current);assert.equal(audit.duplicateSiteIds,1);assert.equal(audit.missingSiteIds,1);
});
test('capacity, empty populations, category balance, strict/broader/stale sensitivity and comparisons',()=>{
  const current=Array.from({length:14},(_,i)=>row(String(i),{STYPE:i%2?'圖書館':'公園'}));
  const snapshot=buildSnapshot([...current,row('out',{county:'新北市'}),row('',{STYPE:'行政機關'})],[...current,row('gone')],editions);
  for(const capacity of [5,10,'all'] as const){const scenario=runWifiPolicyScenario(snapshot,{...settings,capacity});assert.equal(scenario.capacityUsed,capacity==='all'?14:capacity);}
  const evidence=runWifiPolicyScenario(snapshot,settings),balanced=runWifiPolicyScenario(snapshot,{...settings,strategy:'balanced'});
  assert.equal(balanced.categories.length,2);assert.equal(compareWifiPolicyScenarios(evidence,evidence).equivalent,true);
  assert.ok(runWifiPolicyScenario(snapshot,{...settings,eligibility:'broader',includeStale:true,capacity:'all'}).eligibleCount>14);
  assert.equal(runWifiPolicyScenario(snapshot,{...settings,category:'absent'}).eligibleCount,0);
  assert.throws(()=>compareWifiPolicyScenarios(evidence,{...evidence,snapshotId:'other'}));
  assert.equal(snapshot.modes.B.available,false);assert.equal(snapshot.modes.C.available,false);
});
test('removed legacy rows retain duplicate diagnostics from their own edition',()=>{
  const legacy = [row('legacy-site', { HOTSPOT_ID: 'old-ap-1' }), row('legacy-site', { HOTSPOT_ID: 'old-ap-2' })];
  const snapshot = buildSnapshot([row('current')], legacy, editions);
  const stale = snapshot.candidates.filter(candidate => candidate.stale);
  assert.equal(stale.length, 2);
  assert.ok(stale.every(candidate => candidate.issues.includes('duplicate-site-id')));
  assert.ok(stale.every(candidate => !candidate.issues.includes('duplicate-hotspot-id')));
});
test('exports preserve governance and neutralize formula injection without quadratic metadata',()=>{
  const rows=Array.from({length:300},(_,i)=>row(String(i),{NAME:' =HYPERLINK("evil")'}));const snapshot=buildSnapshot(rows,rows,editions),scenario=runWifiPolicyScenario(snapshot,{...settings,capacity:'all'});
  assert.ok(safePolicyCsvCell('\t=1').startsWith('"\''));assert.ok(safePolicyCsvCell('-1').startsWith('"\''));
  const csv=createWifiPolicyCsvExport(snapshot,scenario);assert.equal(csv.match(/decision_metadata_json/g)?.length,1);assert.equal(csv.match(/Independent research POC/g)?.length,1);assert.ok(csv.length<500_000);
  const exported=JSON.parse(createWifiPolicyJsonExport(snapshot,scenario));assert.equal(exported.scenario.selectedIds.length,300);assert.equal(exported.sourceEditions[0].retrievedAt,null);
  assert.throws(()=>createWifiPolicyJsonExport(snapshot,{...scenario,snapshotId:'other'}));
});
test('allowlist and bounded failed fetch reject redirects, oversized, empty and failed resources',async()=>{
  const url='https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=549b3a9b-eb6c-4cb1-848b-8c238735e2db';
  for(const value of ['http://data.taipei/a','https://evil.example/a','https://data.taipei@evil.example/a'])assert.throws(()=>validateFetchUrl(value));
  assert.deepEqual(await fetchOfficialBytes(url,(async()=>new Response('csv')) as typeof fetch),Buffer.from('csv'));
  for(const response of [new Response('',{status:404}),new Response('',{headers:{'content-length':'10000001'}}),new Response('')])await assert.rejects(fetchOfficialBytes(url,(async()=>response.clone()) as typeof fetch));
});
test('atomic snapshot validation protects last-good artifacts; immutable hash and nested schema checked',async()=>{
  const directory=await mkdtemp(path.join(process.cwd(),'.wifi-policy-test-'));try{
    const snapshot=buildSnapshot([row()],[row()],editions);await publishSnapshot(snapshot,directory);const good=await readFile(path.join(directory,'snapshot.json'),'utf8');
    const bad={...snapshot,candidates:[{...snapshot.candidates[0],tier:'INVALID'}]} as unknown as WifiPolicySnapshot;
    await assert.rejects(publishSnapshot(bad,directory));assert.equal(await readFile(path.join(directory,'snapshot.json'),'utf8'),good);
    await writeFile(path.join(directory,`${snapshot.snapshotId}.json`),'corrupt');await assert.rejects(publishSnapshot(snapshot,directory));
    assert.throws(()=>validateWifiPolicySnapshot({...snapshot,modes:{A:null}}));assert.throws(()=>validateSnapshot({...snapshot,snapshotId:'wifi-policy-000000000000000000000000'}));
    const incomplete = structuredClone(snapshot);
    delete (incomplete.reconciliation.current as Partial<typeof incomplete.reconciliation.current>).rows;
    assert.throws(()=>validateWifiPolicySnapshot(incomplete));
    assert.throws(()=>validateWifiPolicySnapshot({...snapshot,sourceEditions:[{...snapshot.sourceEditions[0],url:'javascript:alert(1)'}]}));
  }finally{await rm(directory,{recursive:true,force:true});}
});
test('production manifest hashes and deterministic real snapshot are independently verified',async()=>{
  const manifest=await readVerifiedSources();assert.equal(manifest.sources.find((s:{id:string})=>s.id==='A').sha256,'09c150e7b8a75e1477413ddcc37059fe97b3c2353ac9f8799069e65d8f81cc55');
  const snapshot=JSON.parse(await readFile('public/data/wifi-policy/snapshot.json','utf8'));validateSnapshot(snapshot);
  assert.equal(snapshot.reconciliation.current.rows,3305);assert.equal(snapshot.reconciliation.legacy.rows,3297);assert.equal(snapshot.reconciliation.changedCoordinates,33);
  assert.equal(snapshot.reconciliation.added,19);assert.equal(snapshot.reconciliation.removed,11);assert.equal(snapshot.modes.C.available,false);
  assert.ok(snapshot.candidates.every((c:{sourceEdition:string})=>manifest.sources.some((s:{sha256:string})=>s.sha256===c.sourceEdition)||c.sourceEdition===manifest.legacy.sha256));
});
