import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { TAIPEI_CITY_DISTRICTS, normalizeArea } from '../src/lib/wifi.js';
import type { InventoryAudit } from '../src/types/wifiPolicy.js';

export const sha256 = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
export const lexical = (a:string,b:string) => a < b ? -1 : a > b ? 1 : 0;
export const REQUIRED_COLUMNS = ['SITE_ID','Agency Codes','MINISTRY','AGENCY','STYPE','NAME','VENDOR_ID','HOTSPOT_ID','ZipCode','county','AREA','ADDR','LATITUDE','LONGITUDE','E-MINISTRY','E_AGENCY','E_STYPE','E_NAME','E_CITY','E_AREA','E_ADDR'];
export function parsePolicyCsv(bytes: Uint8Array): Record<string,string>[] {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  const rows: string[][] = []; let row: string[] = [], field = '', state: 'plain'|'quoted'|'closed' = 'plain';
  const endField = () => { row.push(field); field = ''; state = 'plain'; };
  const endRow = () => { endField(); if (row.some(v => v !== '')) rows.push(row); row = []; };
  for (let i=0; i<text.length; i++) {
    const c=text[i];
    if (state === 'quoted') { if (c === '"') { if(text[i+1] === '"') {field+='"';i++;} else state='closed'; } else field+=c; continue; }
    if (c === ',') {endField();continue;}
    if (c === '\r' || c === '\n') {if(c==='\r'&&text[i+1]==='\n')i++;endRow();continue;}
    if (state === 'closed') throw new Error('Unexpected content after CSV closing quote.');
    if(c==='"') {if(field)throw new Error('Quote inside unquoted CSV field.');state='quoted';} else field+=c;
  }
  if(state==='quoted')throw new Error('Unclosed CSV quote.');
  if(field || row.length || state==='closed')endRow();
  const [headers, ...body] = rows;
  if(!headers || !body.length)throw new Error('Empty official CSV resource.');
  if(new Set(headers).size!==headers.length)throw new Error('Duplicate CSV columns.');
  for(const column of REQUIRED_COLUMNS)if(!headers.includes(column))throw new Error(`Missing required column ${column}`);
  if(headers.some(column=>!REQUIRED_COLUMNS.includes(column)))throw new Error('Unaccepted inventory schema drift.');
  return body.map(values => {if(values.length!==headers.length)throw new Error('CSV row width mismatch.');return Object.fromEntries(headers.map((h,i)=>[h,values[i].trim()]));});
}
export function validWgs84(lon: unknown, lat: unknown) {
  const numeric=(v:unknown)=> (typeof v==='number'||typeof v==='string'&&/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(v.trim()))&&Number.isFinite(Number(v));
  return numeric(lon) && numeric(lat) && Math.abs(Number(lon))<=180 && Math.abs(Number(lat))<=90;
}
export function sourceScope(row: Record<string,string>): 'taipei-source'|'outside-source'|'unresolved' {
  const district=normalizeArea(row.AREA ?? '');
  if (['臺北市','台北市'].includes(row.county) && TAIPEI_CITY_DISTRICTS.includes(district as typeof TAIPEI_CITY_DISTRICTS[number]))return 'taipei-source';
  return row.county && !['臺北市','台北市'].includes(row.county) ? 'outside-source' : 'unresolved';
}
export function countValues(values: string[]) {const counts: Record<string,number>=Object.create(null);for(const v of values)counts[v||'(missing)']=(counts[v||'(missing)']??0)+1;return Object.fromEntries(Object.entries(counts).sort(([a],[b])=>lexical(a,b)));}
export function auditInventory(rows: Record<string,string>[]): InventoryAudit {
  const sites=countValues(rows.map(r=>r.SITE_ID)),hotspots=countValues(rows.map(r=>r.HOTSPOT_ID));
  return {rows:rows.length,uniqueSiteIds:Object.keys(sites).filter(k=>k!=='(missing)').length,uniqueHotspotIds:Object.keys(hotspots).filter(k=>k!=='(missing)').length,
    duplicateSiteIds:Object.entries(sites).filter(([k,v])=>k!=='(missing)'&&v>1).length,duplicateHotspotIds:Object.entries(hotspots).filter(([k,v])=>k!=='(missing)'&&v>1).length,
    missingSiteIds:sites['(missing)']??0,missingHotspotIds:hotspots['(missing)']??0,invalidCoordinates:rows.filter(r=>!validWgs84(r.LONGITUDE,r.LATITUDE)).length,
    taipeiSourceRows:rows.filter(r=>sourceScope(r)==='taipei-source').length,outsideSourceRows:rows.filter(r=>sourceScope(r)==='outside-source').length,
    byDistrict:countValues(rows.map(r=>normalizeArea(r.AREA))),byCategory:countValues(rows.map(r=>r.STYPE)),byAgency:countValues(rows.map(r=>`${r.AGENCY}|${r.VENDOR_ID}`))};
}
export async function readVerifiedSources() {
  const manifest=JSON.parse(await readFile('data/raw/wifi-policy/acquisition-manifest.json','utf8'));
  if(manifest.acquisitionContract!=='wifi-policy-retained-original-bytes-v1'||!Array.isArray(manifest.sources))throw new Error('Invalid acquisition manifest.');
  for(const source of manifest.sources) {
    if(source.status!=='acquired')continue;
    const url=new URL(source.url);
    if(!['data.taipei','tsis.dbas.gov.taipei'].includes(url.hostname)||url.protocol!=='https:'||url.username||url.password)throw new Error('Non-allowlisted official source URL.');
    if(source.resourceId&&(url.pathname!=='/api/frontstage/tpeod/dataset/resource.download'||url.searchParams.get('rid')!==source.resourceId))throw new Error('Resource identity mismatch.');
    const location=path.resolve(source.path); const rawRoot=path.resolve('data/raw/wifi-policy')+path.sep;
    if(!location.startsWith(rawRoot))throw new Error('Source path escapes retained source root.');
    const bytes=await readFile(location);
    if(sha256(bytes)!==source.sha256||bytes.byteLength!==source.bytes)throw new Error(`Source hash/size mismatch ${source.id}`);
  }
  for(const evidence of [...(manifest.evidenceFiles??[]),manifest.legacy].filter(Boolean)) {
    const location=path.resolve(evidence.path),rawRoot=path.resolve('data/raw')+path.sep;
    if(!location.startsWith(rawRoot))throw new Error('Evidence path escapes raw root.');
    const bytes=await readFile(location);if(bytes.length!==evidence.bytes||sha256(bytes)!==evidence.sha256)throw new Error('Evidence/legacy hash mismatch.');
  }
  return manifest;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const manifest=await readVerifiedSources(); const source=manifest.sources.find((s:{id:string})=>s.id==='A');
  if(source?.status!=='acquired')throw new Error('Validated source A is unavailable.');
  if(!source.path.endsWith('.csv'))throw new Error('Unsupported inventory resource format.');
  console.log(JSON.stringify(auditInventory(parsePolicyCsv(await readFile(source.path))),null,2));
}
