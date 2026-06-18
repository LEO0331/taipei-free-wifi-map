import assert from 'node:assert/strict';
import test from 'node:test';
import type { WifiHotspot } from '../src/types.js';
import {
  buildWifiSummary,
  calculateDistanceMeters,
  classifyWifiHotspotType,
  filterWifiHotspots,
  formatDistance,
  getGoogleMapsUrl,
  hasValidCoordinates,
  normalizeArea,
  normalizeColumnName,
  parseCoordinate,
  validateWifiCoordinate,
} from '../src/lib/wifi.js';

const hotspot = (overrides: Partial<WifiHotspot> = {}): WifiHotspot => ({
  id: 'site-1',
  siteId: 'site-1',
  hotspotTypeZh: '圖書館',
  hotspotCategory: 'library',
  nameZh: '市立圖書館',
  areaZh: '信義區',
  addressZh: '市府路 1 號',
  latitude: 25.0375,
  longitude: 121.5637,
  coordinateStatus: 'valid',
  isTaipeiCity: true,
  agencyZh: '資訊局',
  vendorId: 'VENDOR',
  hotspotId: 'HOTSPOT-1',
  source: '臺北市公眾區免費無線上網熱點資料(新版)',
  ...overrides,
});

test('normalization trims column names, coordinates, and district suffixes', () => {
  assert.equal(normalizeColumnName(' \uFEFF SITE_ID '), 'SITE_ID');
  assert.equal(parseCoordinate(' 121.5 '), 121.5);
  assert.equal(parseCoordinate('not-a-number'), undefined);
  assert.equal(normalizeArea('台北市 信義區'), '信義區');
  assert.equal(normalizeArea('新店'), '新店區');
});

test('coordinate validation distinguishes valid, missing, and outlier values', () => {
  assert.equal(validateWifiCoordinate(121.56, 25.04), 'valid');
  assert.equal(validateWifiCoordinate(undefined, 25.04), 'missing');
  assert.equal(validateWifiCoordinate(120, 25.04), 'outlier');
  assert.equal(hasValidCoordinates(hotspot()), true);
  assert.equal(hasValidCoordinates(hotspot({ latitude: undefined, coordinateStatus: 'missing' })), false);
});

test('category mapping follows the requested Chinese hotspot types', () => {
  assert.equal(classifyWifiHotspotType('公車站'), 'bus_station');
  assert.equal(classifyWifiHotspotType('商圈市集'), 'market_shopping');
  assert.equal(classifyWifiHotspotType('藝文場館'), 'arts_culture');
  assert.equal(classifyWifiHotspotType('未分類'), 'other');
});

test('filters search bilingual fields and respect Taipei City only', () => {
  const records = [
    hotspot({ nameEn: 'City Library' }),
    hotspot({ id: 'outside', siteId: 'outside', nameZh: '新店站', areaZh: '新店區', isTaipeiCity: false }),
  ];
  assert.equal(filterWifiHotspots(records, {
    search: 'city library',
    area: '',
    hotspotType: '',
    agency: '',
    vendor: '',
    taipeiCityOnly: false,
  }).length, 1);
  assert.equal(filterWifiHotspots(records, {
    search: '',
    area: '',
    hotspotType: '',
    agency: '',
    vendor: '',
    taipeiCityOnly: true,
  }).length, 1);
});

test('distance helpers calculate, format, and link coordinates', () => {
  const meters = calculateDistanceMeters(25.0375, 121.5637, 25.033, 121.5654);
  assert.ok(meters > 400 && meters < 600);
  assert.equal(formatDistance(280, 'zh'), '280 公尺');
  assert.equal(formatDistance(1280, 'en'), '1.3 km');
  assert.equal(getGoogleMapsUrl(25.0375, 121.5637), 'https://www.google.com/maps?q=25.0375,121.5637');
});

test('summary counts valid, Taipei, outside, area, type, category, and agency totals', () => {
  const summary = buildWifiSummary([
    hotspot(),
    hotspot({
      id: 'outside',
      siteId: 'outside',
      areaZh: '新店區',
      isTaipeiCity: false,
      coordinateStatus: 'outlier',
      agencyZh: undefined,
    }),
  ]);
  assert.equal(summary.total, 2);
  assert.equal(summary.validCoordinateCount, 1);
  assert.equal(summary.taipeiCityCount, 1);
  assert.equal(summary.outsideTaipeiCount, 1);
  assert.deepEqual(summary.byArea[0], { area: '信義區', count: 1 });
  assert.deepEqual(summary.byAgency[0], { agency: '資訊局', count: 1 });
});
