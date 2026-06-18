import type { WifiHotspot } from '../types.js';
import {
  TAIPEI_CITY_DISTRICTS,
  classifyWifiHotspotType,
  normalizeArea,
  normalizeColumnName,
  parseCoordinate,
  validateWifiCoordinate,
} from './wifi.js';

export const WIFI_SOURCE = '臺北市公眾區免費無線上網熱點資料(新版)';

const optional = (value: unknown): string | undefined => {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
};

export function normalizeWifiRow(row: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeColumnName(key), value.trim()]),
  );
}

export function convertWifiRow(rawRow: Record<string, string>, index: number): WifiHotspot {
  const row = normalizeWifiRow(rawRow);
  const latitude = parseCoordinate(row.LATITUDE);
  const longitude = parseCoordinate(row.LONGITUDE);
  const areaZh = normalizeArea(row.AREA ?? '');
  const siteId = optional(row.SITE_ID) ?? optional(row.HOTSPOT_ID) ?? `record-${index + 1}`;
  const hotspotTypeZh = optional(row.STYPE) ?? '其他';

  return {
    id: siteId,
    siteId,
    agencyCode: optional(row['Agency Codes']),
    ministryZh: optional(row.MINISTRY),
    agencyZh: optional(row.AGENCY),
    hotspotTypeZh,
    hotspotCategory: classifyWifiHotspotType(hotspotTypeZh),
    nameZh: optional(row.NAME) ?? '未提供名稱',
    vendorId: optional(row.VENDOR_ID),
    hotspotId: optional(row.HOTSPOT_ID),
    zipCode: optional(row.ZipCode),
    cityZh: optional(row.county),
    areaZh,
    addressZh: optional(row.ADDR) ?? '未提供地址',
    latitude,
    longitude,
    coordinateStatus: validateWifiCoordinate(longitude, latitude),
    isTaipeiCity: TAIPEI_CITY_DISTRICTS.includes(
      areaZh as (typeof TAIPEI_CITY_DISTRICTS)[number],
    ),
    ministryEn: optional(row['E-MINISTRY']),
    agencyEn: optional(row.E_AGENCY),
    hotspotTypeEn: optional(row.E_STYPE),
    nameEn: optional(row.E_NAME),
    cityEn: optional(row.E_CITY),
    areaEn: optional(row.E_AREA),
    addressEn: optional(row.E_ADDR),
    source: WIFI_SOURCE,
  };
}
