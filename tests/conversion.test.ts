import assert from 'node:assert/strict';
import test from 'node:test';
import { convertWifiRow } from '../src/lib/conversion.js';

test('convertWifiRow keeps outside-Taipei records and maps bilingual fields', () => {
  const record = convertWifiRow({
    SITE_ID: 'SITE-1',
    'Agency Codes': 'A-1',
    MINISTRY: '臺北市政府',
    AGENCY: '資訊局',
    STYPE: '圖書館',
    NAME: '測試熱點',
    VENDOR_ID: 'VENDOR',
    HOTSPOT_ID: 'HOTSPOT',
    ZipCode: '231',
    county: '新北市',
    AREA: '新店區',
    ADDR: '新店路 1 號',
    LATITUDE: '24.96',
    LONGITUDE: '121.54',
    'E-MINISTRY': 'Taipei City Government',
    E_AGENCY: 'Department of Information Technology',
    E_STYPE: 'Library',
    E_NAME: 'Test hotspot',
    E_CITY: 'New Taipei City',
    E_AREA: 'Xindian District',
    E_ADDR: 'No. 1, Xindian Rd.',
  }, 0);

  assert.equal(record.isTaipeiCity, false);
  assert.equal(record.coordinateStatus, 'valid');
  assert.equal(record.hotspotCategory, 'library');
  assert.equal(record.nameEn, 'Test hotspot');
  assert.equal(record.source, '臺北市公眾區免費無線上網熱點資料(新版)');
});

test('convertWifiRow reports missing and outlier coordinates without throwing', () => {
  const missing = convertWifiRow({ SITE_ID: 'missing', STYPE: '', NAME: '', AREA: '', ADDR: '' }, 0);
  const outlier = convertWifiRow({
    SITE_ID: 'outlier',
    STYPE: '公園',
    NAME: '遠方公園',
    AREA: '信義區',
    ADDR: '測試',
    LATITUDE: '20',
    LONGITUDE: '120',
  }, 1);

  assert.equal(missing.coordinateStatus, 'missing');
  assert.equal(outlier.coordinateStatus, 'outlier');
});
