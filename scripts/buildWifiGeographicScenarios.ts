import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { sha256 } from './auditWifiPolicySources.js';
import { validateGeographicManifest, validateGeographicSnapshot } from '../src/lib/wifiGeographicPolicy.js';
import { compareGeographicScenarios, defaultGeographicSettings, runGeographicScenario } from '../src/lib/wifiGeographicScenarios.js';

const root='public/data/wifi-policy/geographic-v1.1/';
const manifest:unknown=JSON.parse(await readFile(root+'manifest.json','utf8'));
validateGeographicManifest(manifest);
const bytes=await readFile(root+manifest.artifacts['snapshot.json'].path);
if(sha256(bytes)!==manifest.artifacts['snapshot.json'].sha256)throw new Error('Snapshot hash mismatch');
const snapshot:unknown=JSON.parse(bytes.toString('utf8'));validateGeographicSnapshot(snapshot);
const scenarios=[];
for(const evidence of ['verified','assumed'] as const)for(const radius of [100,250,500] as const)for(const geography of ['strict','flagged'] as const)for(const cohort of ['all','B','C','D'] as const)for(const capacity of [5,10,'all'] as const)for(const strategy of ['marginal','representation'] as const){
  const settings={evidence,radius,geography,cohort,capacity,strategy};
  scenarios.push(runGeographicScenario(snapshot,manifest.versionId,settings));
}
const current=runGeographicScenario(snapshot,manifest.versionId,defaultGeographicSettings);
const result={versionId:manifest.versionId,methodVersion:snapshot.methodVersion,default:current,scenarios,
  differences:scenarios.map(s=>({settings:s.settings,difference:compareGeographicScenarios(current,s)}))};
const serialized=JSON.stringify(result)+'\n', hash=sha256(serialized);
const file=`scenarios-${hash.slice(0,24)}.json`;
try {await writeFile(root+file,serialized,{flag:'wx'});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST'||sha256(await readFile(root+file))!==hash)throw error;}
await writeFile(root+'scenarios-manifest.json.tmp',JSON.stringify({versionId:manifest.versionId,path:file,sha256:hash,bytes:Buffer.byteLength(serialized)})+'\n');
await rename(root+'scenarios-manifest.json.tmp',root+'scenarios-manifest.json');
if(process.argv.includes('--measure')) {
const durations:number[]=[];
for(let i=0;i<100;i++){const start=performance.now();runGeographicScenario(snapshot,manifest.versionId,defaultGeographicSettings);durations.push(performance.now()-start);}
durations.sort((a,b)=>a-b);
const sizes=await Promise.all(Object.entries(manifest.artifacts).map(async([name,a])=>{const b=await readFile(root+a.path);return {name,bytes:b.length,gzipBytes:gzipSync(b).length,sha256:sha256(b)};}));
await mkdir('docs/evidence/geographic-v1.1',{recursive:true});
await writeFile('docs/evidence/geographic-v1.1/measurements.json',JSON.stringify({localOnly:true,node:process.version,platform:process.platform,versionId:manifest.versionId,scenarioCount:scenarios.length,scenarioPayload:{bytes:Buffer.byteLength(serialized),gzipBytes:gzipSync(serialized).length,sha256:hash},defaultScenarioMedianMs:durations[50],defaultScenarioP95Ms:durations[95],artifacts:sizes},null,2)+'\n');
console.log(JSON.stringify({scenarios:scenarios.length,scenarioHash:hash,localMedianMs:durations[50]}));
} else console.log(JSON.stringify({scenarios:scenarios.length,scenarioHash:hash,versionId:manifest.versionId,defaultDenominator:current.referenceDenominator,defaultBaseline:current.baselineProximate,optimizationAvailable:current.optimizationAvailable}));
