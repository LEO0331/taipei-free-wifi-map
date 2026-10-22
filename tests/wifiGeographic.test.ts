import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { Facility, GeographicSnapshot, GeographicManifest } from '../src/types/wifiGeographicPolicy.js';
import { checkedGeographicJson, geographicCsv, geographicExport, validateGeographicManifest, validateGeographicSnapshot } from '../src/lib/wifiGeographicPolicy.js';
import { defaultGeographicSettings as defaults, compareGeographicScenarios, runGeographicScenario } from '../src/lib/wifiGeographicScenarios.js';

const root='public/data/wifi-policy/geographic-v1.1/';
const manifest:GeographicManifest=JSON.parse(await readFile(root+'manifest.json','utf8'));
const snapshot:GeographicSnapshot=JSON.parse(await readFile(root+manifest.artifacts['snapshot.json'].path,'utf8'));
const run=(s=snapshot,settings={...defaults})=>runGeographicScenario(s,manifest.versionId,settings);
const hash=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
function fixture() {
  const original=snapshot.facilities.find(f=>f.eligible)!;
  const facility=(id:string,neighbors:{id:string;meters:number}[],distance:number,source:'B'|'C'|'D',district:string):Facility=>({...structuredClone(original),id,source,spatial:{...original.spatial,district},nearestHotspotMeters:{strict:distance,flagged:distance},neighbors});
  const rows=[facility('a',[{id:'a',meters:0},{id:'b',meters:100}],200,'B','X'),facility('b',[{id:'a',meters:100},{id:'b',meters:0},{id:'c',meters:100}],200,'B','X'),facility('c',[{id:'b',meters:100},{id:'c',meters:0}],200,'D','Y')];
  return {...structuredClone(snapshot),facilities:rows};
}

test('geographic manifest, immutable baseline, original source hashes and all portable artifact hashes',async()=>{
  validateGeographicManifest(manifest);validateGeographicSnapshot(snapshot);
  for(const a of Object.values(manifest.artifacts)){const b=await readFile(root+a.path);assert.equal(hash(b),a.sha256);assert.equal(b.length,a.bytes);}
  const old=await readFile(`public/data/wifi-policy/${snapshot.baselineSnapshot.id}.json`);assert.equal(hash(old),snapshot.baselineSnapshot.sha256);
  const v1=JSON.parse(old.toString());assert.equal(v1.candidates.length,3316);assert.deepEqual(v1.summary.byTier,{A:63,B:57,C:3196});
  for(const source of snapshot.sourceEditions)assert.equal(hash(await readFile(source.path)),source.sha256);
  const explorer=JSON.parse(await readFile('public/data/wifi-hotspots.json','utf8'));assert.equal(explorer.length,3297);
});

test('all actual facility cohorts, empty verified-only, capacities and deterministic source IDs',()=>{
  assert.equal(snapshot.facilities.length,91);assert.equal(run().candidateCount,87);
  assert.equal(run(snapshot,{...defaults,evidence:'verified'}).candidateCount,0);
  for(const capacity of [5,10,'all'] as const)for(const strategy of ['marginal','representation'] as const){
    const result=run(snapshot,{...defaults,capacity,strategy});assert.equal(result.selected.length,capacity==='all'?87:capacity);
    assert.equal(new Set(result.selectedIds).size,result.selected.length);
    assert.deepEqual(run({...snapshot,facilities:[...snapshot.facilities].reverse()},{...defaults,capacity,strategy}),result);
  }
  for(const [cohort,count] of [['B',69],['C',9],['D',9]] as const)assert.equal(run(snapshot,{...defaults,cohort}).candidateCount,count);
  assert.equal(snapshot.modeC.available,false);
});

test('marginal recalculation excludes counted references, explicit zero-distance self and exact threshold',()=>{
  const result=run(fixture());assert.equal(result.selectedIds[0],'b');assert.equal(result.selected[0].ownReference,1);
  assert.equal(result.selected[0].additionalReferences,2);assert.equal(result.selected[1].marginalReferences,0);
  assert.equal(result.newlyProximate,3);assert.equal(result.optimizationAvailable,true);
  const allProximate=fixture();allProximate.facilities.forEach(f=>{f.nearestHotspotMeters.strict=100;});
  const baseline=run(allProximate);assert.equal(baseline.baselineProximate,3);assert.equal(baseline.newlyProximate,0);assert.equal(baseline.optimizationAvailable,false);
  const justOutside=fixture();justOutside.facilities.forEach(f=>{f.neighbors=f.neighbors.filter(n=>n.id===f.id || n.meters<99.999);});
  assert.equal(run(justOutside).optimizationAvailable,false);
});

test('colocated distinct reference records retain identity; self-only outcome disables optimization',()=>{
  const data=fixture();data.facilities.forEach(f=>{f.neighbors=[{id:f.id,meters:0}];});
  const result=run(data);assert.equal(result.optimizationAvailable,false);assert.equal(result.ownContributions,3);assert.equal(result.additionalContributions,0);
  data.facilities[0].neighbors.push({id:'b',meters:0});
  assert.equal(run(data).optimizationAvailable,true);assert.equal(run(data).selected[0].additionalReferences,1);
  const identical=fixture();identical.facilities.forEach(f=>{f.neighbors=identical.facilities.map(r=>({id:r.id,meters:r.id===f.id?0:50}));});
  assert.equal(run(identical).optimizationAvailable,false);
});

test('round-robin prioritizes unrepresented validated district/category groups deterministically',()=>{
  const data=fixture();data.facilities.forEach(f=>{f.neighbors=[{id:f.id,meters:0}];});
  const result=run(data,{...defaults,strategy:'representation'});
  assert.deepEqual(result.selectedIds,['a','c','b']);assert.deepEqual(result.districts,['X','Y']);assert.deepEqual(result.categories,['B','D']);
});

test('tier, unresolved, strict boundary and cohort eligibility never manufactures a verified population',()=>{
  const data=fixture();data.facilities[0].spatial.status='boundary-adjacent';data.facilities[1].eligible=false;data.facilities[1].tier='unresolved';
  assert.equal(run(data).candidateCount,1);assert.equal(run(data,{...defaults,geography:'flagged'}).candidateCount,2);
  assert.equal(run(data,{...defaults,evidence:'verified'}).candidateCount,0);
  assert.throws(()=>run(data,{...defaults,radius:150 as 100}));
});

test('sensitivity reports added/removed/shared identities, denominator and modeled count changes',()=>{
  const a=run(),b=run(snapshot,{...defaults,capacity:10});const diff=compareGeographicScenarios(a,b);
  assert.equal(diff.shared.length,5);assert.equal(diff.added.length,5);assert.equal(diff.removed.length,0);
  const empty=compareGeographicScenarios(a,run(snapshot,{...defaults,evidence:'verified'}));assert.equal(empty.denominatorChange,-87);
  assert.throws(()=>compareGeographicScenarios(a,{...b,versionId:'different'}));
});

test('exports retain source lineage, assumptions and ordered IDs and prevent CSV formula injection',()=>{
  const s=structuredClone(snapshot);const scenario=run(s);s.facilities.find(f=>f.id===scenario.selectedIds[0])!.name=' =HYPERLINK("https://example.com")';
  const result=geographicExport(s,manifest,scenario);assert.equal(result.sourceEditions.length,5);assert.deepEqual(result.scenario.selectedIds,scenario.selectedIds);
  assert.ok(result.selected.every(r=>r.facility?.sourceHash));assert.ok(result.transform.operation);assert.ok(result.responsibleUse);
  const csv=geographicCsv(s,manifest,scenario);assert.ok(csv.includes("' =HYPERLINK"));assert.equal(csv.split('\r\n').length,7);
  assert.throws(()=>geographicExport(s,{...manifest,versionId:'different'},scenario));
  assert.throws(()=>runGeographicScenario(s,'wifi-geo-'+'0'.repeat(24),defaults));
});

test('nested evidence and unsafe manifest paths reject schema/source-version mismatches',()=>{
  const bad=structuredClone(manifest);bad.artifacts['snapshot.json'].path='../bad';assert.throws(()=>validateGeographicManifest(bad));
  const invalid=structuredClone(snapshot);invalid.facilities[0].sourceHash='0'.repeat(64);assert.throws(()=>validateGeographicSnapshot(invalid));
  const invalid2=structuredClone(snapshot);invalid2.facilities[0].neighbors[0].meters=-1;assert.throws(()=>validateGeographicSnapshot(invalid2));
  const invalid3=structuredClone(snapshot);invalid3.facilities[0].longitude=Infinity;assert.throws(()=>validateGeographicSnapshot(invalid3));
  const duplicate=structuredClone(snapshot);duplicate.facilities[0].neighbors.push(duplicate.facilities[0].neighbors[0]);assert.throws(()=>validateGeographicSnapshot(duplicate));
});

test('browser artifact reader rejects failed fetches, stale mixed bytes and corrupted output',async()=>{
  const bytes=await readFile(root+manifest.artifacts['snapshot.json'].path);
  await assert.rejects(checkedGeographicJson(new Response('error',{status:500}),manifest.artifacts['snapshot.json']));
  await assert.rejects(checkedGeographicJson(new Response('x'),manifest.artifacts['snapshot.json']));
  const corrupt=Buffer.from(bytes);corrupt[20]^=1;
  await assert.rejects(checkedGeographicJson(new Response(corrupt),manifest.artifacts['snapshot.json']));
  validateGeographicSnapshot(await checkedGeographicJson(new Response(bytes),manifest.artifacts['snapshot.json']));
});
