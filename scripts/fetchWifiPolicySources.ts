import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { sha256, readVerifiedSources } from './auditWifiPolicySources.js';

const MAX_BYTES=10_000_000;
const RESOURCE_IDS=new Set(['549b3a9b-eb6c-4cb1-848b-8c238735e2db','fb6cc268-e2b8-43a7-86f2-e79702291a2b','5ae02e14-50fc-4906-86a7-96e0231780e1','e7c46724-3517-4ce5-844f-5a4404897b7d','d8b7eb29-136f-49fc-b14b-3489d3656122']);
export function validateFetchUrl(input:string) {
  const url=new URL(input);
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.hostname!=='data.taipei'||url.pathname!=='/api/frontstage/tpeod/dataset/resource.download'||!RESOURCE_IDS.has(url.searchParams.get('rid')??'')||[...url.searchParams.keys()].some(key=>key!=='rid'))throw new Error('Official resource URL is not allowlisted.');
  return url;
}
export async function fetchOfficialBytes(input:string, fetcher:typeof fetch=fetch):Promise<Uint8Array> {
  const url=validateFetchUrl(input);
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(20_000)});
      if((response.status===429||response.status>=500)&&attempt<2){await response.body?.cancel();const delay=Math.min(2000,Math.max(100,Number(response.headers.get('retry-after')??'0')*1000));await new Promise(resolve=>setTimeout(resolve,delay));continue;}
      if(!response.ok)throw new Error(`Official fetch failed: ${response.status}`);
      if(Number(response.headers.get('content-length')??0)>MAX_BYTES)throw new Error('Official resource exceeds size limit.');
      const reader=response.body?.getReader();if(!reader)throw new Error('Empty official response.');
      const chunks:Uint8Array[]=[];let size=0;
      while(true){const result=await reader.read();if(result.done)break;size+=result.value.length;if(size>MAX_BYTES){await reader.cancel();throw new Error('Official resource exceeds size limit.');}chunks.push(result.value);}
      if(!size)throw new Error('Empty official resource.');return Buffer.concat(chunks);
    }catch(error){if(attempt===2)throw error;}
  }
  throw new Error('Official fetch exhausted.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const manifest=await readVerifiedSources();
  if(!process.argv.includes('--refresh'))console.log('Validated retained sources; no network refresh. Use --refresh to retain new original-byte editions for separate audit acceptance.');
  else {
    const directory='data/raw/wifi-policy/refresh';await mkdir(directory,{recursive:true});
    const acquired=[];
    for(const source of manifest.sources.filter((s:{id:string})=>['A','B','C','D','E'].includes(s.id))) {
      const bytes=await fetchOfficialBytes(source.url);const hash=sha256(bytes),file=path.join(directory,`${source.id}-${hash}.bin`);
      try{await writeFile(file,bytes,{flag:'wx'});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;if(sha256(await readFile(file))!==hash)throw new Error('Immutable refresh collision.');}
      acquired.push({id:source.id,url:source.url,bytes:bytes.length,sha256:hash,path:file,retrievedAt:new Date().toISOString()});
    }
    const record=JSON.stringify({status:'pending-schema-and-catalogue-audit',sources:acquired},null,2);
    await writeFile(path.join(directory,`acquisition-${sha256(record)}.json`),record,{flag:'wx'});
    console.log('Retained refresh bytes. Production acquisition manifest and explorer inputs are unchanged; audit new editions before adoption.');
  }
}
