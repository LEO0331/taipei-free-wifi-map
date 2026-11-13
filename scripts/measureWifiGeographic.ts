import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { runWifiGeographicScenario, compareWifiGeographicScenarios } from '../src/lib/wifiGeographicScenarios.js';
import { createWifiGeographicJsonExport, createWifiGeographicCsvExport } from '../src/lib/wifiGeographicPolicy.js';
import type { GeographicSnapshot } from '../src/types/wifiGeographicPolicy.js';

const directory='public/data/wifi-policy/geographic-v1.1';
const manifest=JSON.parse(await readFile(`${directory}/manifest.json`,'utf8'));
const bytes=await readFile(`${directory}/${manifest.snapshotFile}`);
const snapshot=JSON.parse(bytes.toString()) as GeographicSnapshot;
const defaults={evidence:'assumption-tested' as const,radiusMeters:250 as const,boundary:'strict' as const,boundaryToleranceMeters:25 as const,cohort:'all' as const,capacity:5 as const,strategy:'marginal' as const};
const scenarios=[];
for(const radiusMeters of [100,250,500] as const)for(const capacity of [5,10,'all'] as const)for(const strategy of ['marginal','representation'] as const){
  const settings={...defaults,radiusMeters,capacity,strategy},times=[];
  for(let i=0;i<50;i++){const start=performance.now();runWifiGeographicScenario(snapshot,settings);times.push(performance.now()-start);}
  times.sort((a,b)=>a-b);const result=runWifiGeographicScenario(snapshot,settings);
  const comparison=compareWifiGeographicScenarios(runWifiGeographicScenario(snapshot,{...settings,strategy:'marginal'}),result);
  scenarios.push({settings,eligible:result.eligibleCount,denominator:result.referenceDenominator,baseline:result.baselineProximityCount,increment:result.incrementalReferenceCount,nonself:result.additionalNonSelfCount,optimizationAvailable:result.optimizationAvailable,selectedIds:result.selectedIds,districts:result.districts,categories:result.categories,sharedWithMarginal:comparison.shared.length,localMedianMs:times[25],localP95Ms:times[47]});
}
const artifacts=await Promise.all((await readdir(directory)).map(async name=>{const data=await readFile(`${directory}/${name}`);return {name,bytes:data.length,gzipBytes:gzipSync(data).length,sha256:createHash('sha256').update(data).digest('hex')};}));
const base=runWifiGeographicScenario(snapshot,defaults);
const json=createWifiGeographicJsonExport(snapshot,base),csv=createWifiGeographicCsvExport(snapshot,base);
const assets=await Promise.all((await readdir('dist/assets')).map(async name=>({name,bytes:(await stat(`dist/assets/${name}`)).size})));
const report={measuredAt:new Date().toISOString(),runtime:process.version,platform:process.platform,limitation:'Local warmed pure-function timings, 50 runs/configuration; not public-host or radio performance.',snapshotId:snapshot.snapshotId,manifest,summary:snapshot.summary,artifacts,assets,scenarios,defaultExports:{jsonBytes:Buffer.byteLength(json),csvBytes:Buffer.byteLength(csv),jsonSha256:createHash('sha256').update(json).digest('hex'),csvSha256:createHash('sha256').update(csv).digest('hex')}};
await writeFile('docs/evidence/geographic-v1.1/measurements.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({snapshotId:report.snapshotId,artifacts:artifacts.length,scenarios:scenarios.length,exports:report.defaultExports}));
