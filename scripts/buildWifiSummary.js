import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildWifiSummary } from '../src/lib/wifi.js';
const dataDirectory = path.resolve('public/data');
const hotspots = JSON.parse(await readFile(path.join(dataDirectory, 'wifi-hotspots.json'), 'utf8'));
const summary = buildWifiSummary(hotspots);
await writeFile(path.join(dataDirectory, 'wifi-summary.json'), JSON.stringify(summary, null, 2));
console.log(`Built summary for ${summary.total} hotspots.`);
