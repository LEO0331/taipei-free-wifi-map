import test from 'node:test';
import assert from 'node:assert/strict';
import { runGeographic } from '../scripts/buildWifiDistrictBoundaries.js';

test('offline GIS: CRS, axis order, round trip, hole/multipolygon topology, boundary ambiguity, archive and source integrity', () => {
  assert.doesNotThrow(() => runGeographic('test_geometry'));
});
