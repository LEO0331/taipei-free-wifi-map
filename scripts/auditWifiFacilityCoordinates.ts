import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runGeographic } from './buildWifiDistrictBoundaries.js';

export function auditWifiFacilityCoordinates(): string {
  return runGeographic('facilities');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) console.log(auditWifiFacilityCoordinates());
