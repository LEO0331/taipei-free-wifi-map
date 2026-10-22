import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { sha256 } from './auditWifiPolicySources.js';
const root='public/data/wifi-policy/geographic-v1.1/';
const pointers=['manifest.json','scenarios-manifest.json'];
const before=await Promise.all(pointers.map(p=>readFile(root+p)));
for(const script of ['scripts/runWifiGeographic.ts','scripts/buildWifiGeographicScenarios.ts']) {
  const result=spawnSync(process.execPath,['--import','tsx',script],{stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
for(let i=0;i<pointers.length;i++)if(sha256(await readFile(root+pointers[i]))!==sha256(before[i]))throw new Error(`Non-reproducible geographic pointer: ${pointers[i]}`);
console.log('Geographic generation and scenario pointers reproduced byte-for-byte.');
