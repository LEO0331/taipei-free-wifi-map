import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCsv } from '../src/lib/csv.js';
import { convertWifiRow, WIFI_SOURCE } from '../src/lib/conversion.js';
import type { ConversionReport } from '../src/types.js';

const rawDirectory = path.resolve('data/raw/wifi-hotspots');
const outputDirectory = path.resolve('public/data');
const requestedPath = process.argv.slice(2).find((argument) => !argument.startsWith('--'));

async function findInput(): Promise<string> {
  if (requestedPath) return path.resolve(requestedPath);
  const candidates = (await readdir(rawDirectory))
    .filter((file) => file.endsWith('.csv'))
    .map((file) => path.join(rawDirectory, file));
  if (!candidates.length) {
    throw new Error('No CSV found. Add a file under data/raw/wifi-hotspots or run npm run data:fetch.');
  }
  const dated = await Promise.all(
    candidates.map(async (file) => ({ file, modified: (await stat(file)).mtimeMs })),
  );
  return dated.sort((a, b) => b.modified - a.modified)[0]!.file;
}

const inputPath = await findInput();
const csv = await readFile(inputPath, 'utf8');
const rows = parseCsv(csv);
const hotspots = rows.map(convertWifiRow);
const report: ConversionReport = {
  sourceFile: path.relative(process.cwd(), inputPath),
  convertedAt: new Date().toISOString(),
  source: WIFI_SOURCE,
  inputCount: rows.length,
  outputCount: hotspots.length,
  validCoordinateCount: hotspots.filter((item) => item.coordinateStatus === 'valid').length,
  missingCoordinateCount: hotspots.filter((item) => item.coordinateStatus === 'missing').length,
  outlierCoordinateCount: hotspots.filter((item) => item.coordinateStatus === 'outlier').length,
  taipeiCityCount: hotspots.filter((item) => item.isTaipeiCity).length,
  outsideTaipeiCount: hotspots.filter((item) => !item.isTaipeiCity).length,
  notes: [
    'UTF-8 BOM is removed during parsing.',
    'Empty optional fields are omitted from JSON.',
    'Outside-Taipei records are retained with isTaipeiCity=false.',
    'Missing and outlier coordinates are excluded from map markers by the client.',
  ],
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(
    path.join(outputDirectory, 'wifi-hotspots.json'),
    JSON.stringify(hotspots, null, 2),
  ),
  writeFile(
    path.join(outputDirectory, 'conversion-report.json'),
    JSON.stringify(report, null, 2),
  ),
]);
console.log(
  `Converted ${report.outputCount} records (${report.validCoordinateCount} valid coordinates, ${report.outsideTaipeiCount} outside Taipei).`,
);
