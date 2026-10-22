// Local production-only verification server; logs actual browser requests.
import http from 'node:http';
import { appendFileSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
const base='/taipei-free-wifi-map/',root=path.resolve('dist');
const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.geojson':'application/geo+json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{
  appendFileSync('docs/evidence/geographic-v1.1/browser-requests.jsonl',JSON.stringify({at:new Date().toISOString(),method:req.method,url:req.url})+'\n');
  try {
    const url=new URL(req.url??'/', 'http://localhost');
    if(!url.pathname.startsWith(base))throw new Error('base');
    const file=path.resolve(root,decodeURIComponent(url.pathname.slice(base.length))||'index.html');
    if(!file.startsWith(root+path.sep)||!statSync(file).isFile())throw new Error('path');
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(readFileSync(file));
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(4180,'127.0.0.1',()=>console.log('Verification: http://127.0.0.1:4180'+base));
