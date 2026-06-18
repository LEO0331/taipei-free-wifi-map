import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL =
  'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=549b3a9b-eb6c-4cb1-848b-8c238735e2db';
const rawDirectory = path.resolve('data/raw/wifi-hotspots');
const metadataPath = path.join(rawDirectory, 'download-metadata.json');
const force = process.argv.includes('--force');

await mkdir(rawDirectory, { recursive: true });
const existingFiles = (await readdir(rawDirectory)).filter((file) => file.endsWith('.csv')).sort();

if (existingFiles.length && !force) {
  const existingPath = path.join(rawDirectory, existingFiles.at(-1)!);
  const details = await stat(existingPath);
  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        sourceUrl: SOURCE_URL,
        downloadedAt: details.mtime.toISOString(),
        file: path.relative(process.cwd(), existingPath),
        fileSize: details.size,
        reusedExistingFile: true,
        notes: ['Existing CSV retained. Pass --force to download the official resource again.'],
      },
      null,
      2,
    ),
  );
  console.log(`Using existing CSV: ${path.relative(process.cwd(), existingPath)}`);
  process.exit(0);
}

const response = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(30_000) });
if (!response.ok) {
  throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`);
}

const bytes = Buffer.from(await response.arrayBuffer());
if (!bytes.subarray(0, 200).toString('utf8').replace(/^\uFEFF/, '').startsWith('SITE_ID,')) {
  throw new Error('Downloaded resource is not the expected Taipei Free Wi-Fi CSV.');
}
const date = new Date().toISOString().slice(0, 10);
const outputPath = path.join(rawDirectory, `taipei-free-wifi-${date}.csv`);
await writeFile(outputPath, bytes);
await writeFile(
  metadataPath,
  JSON.stringify(
    {
      sourceUrl: SOURCE_URL,
      downloadedAt: new Date().toISOString(),
      file: path.relative(process.cwd(), outputPath),
      fileSize: bytes.byteLength,
      reusedExistingFile: false,
      notes: ['Official CSV resource downloaded from Taipei Open Data.'],
    },
    null,
    2,
  ),
);
console.log(`Downloaded ${bytes.byteLength.toLocaleString()} bytes to ${outputPath}`);
