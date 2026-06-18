import assert from 'node:assert/strict';
import test from 'node:test';
import type { WifiHotspot } from '../src/types.js';
import { getHotspotText, getNearbyHotspots } from '../src/lib/view.js';

const item = (overrides: Partial<WifiHotspot> = {}): WifiHotspot => ({
  id: '1',
  siteId: '1',
  hotspotTypeZh: '公園',
  hotspotCategory: 'park',
  nameZh: '中文名稱',
  areaZh: '信義區',
  addressZh: '中文地址',
  latitude: 25.0375,
  longitude: 121.5637,
  coordinateStatus: 'valid',
  isTaipeiCity: true,
  source: '臺北市公眾區免費無線上網熱點資料(新版)',
  ...overrides,
});

test('getHotspotText uses English fields and falls back to Chinese', () => {
  assert.deepEqual(getHotspotText(item({ nameEn: 'English name' }), 'en'), {
    name: 'English name',
    type: '公園',
    area: '信義區',
    address: '中文地址',
    agency: '',
  });
});

test('getNearbyHotspots excludes invalid coordinates and sorts within radius', () => {
  const results = getNearbyHotspots(
    [
      item({ id: 'far', siteId: 'far', latitude: 25.04 }),
      item({ id: 'near', siteId: 'near', latitude: 25.0376 }),
      item({ id: 'invalid', siteId: 'invalid', coordinateStatus: 'missing', latitude: undefined }),
    ],
    { latitude: 25.0375, longitude: 121.5637 },
    500,
  );
  assert.deepEqual(results.map(({ hotspot }) => hotspot.id), ['near', 'far']);
});
