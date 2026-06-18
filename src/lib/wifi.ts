import type {
  CoordinateStatus,
  Filters,
  Language,
  WifiHotspot,
  WifiHotspotCategory,
  WifiSummary,
} from '../types.js';

export const TAIPEI_WIFI_BOUNDS = {
  minLng: 121.4,
  maxLng: 121.72,
  minLat: 24.88,
  maxLat: 25.25,
} as const;

export const TAIPEI_CITY_DISTRICTS = [
  '中正區',
  '大同區',
  '中山區',
  '松山區',
  '大安區',
  '萬華區',
  '信義區',
  '士林區',
  '北投區',
  '內湖區',
  '南港區',
  '文山區',
] as const;

export function normalizeColumnName(raw: string): string {
  return raw.replace(/^\uFEFF/, '').trim();
}

export function parseCoordinate(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || String(raw).trim() === '') return undefined;
  const coordinate = Number(String(raw).trim());
  return Number.isFinite(coordinate) ? coordinate : undefined;
}

export function validateWifiCoordinate(
  longitude?: number,
  latitude?: number,
): CoordinateStatus {
  if (longitude === undefined || latitude === undefined) return 'missing';
  const { minLng, maxLng, minLat, maxLat } = TAIPEI_WIFI_BOUNDS;
  return longitude >= minLng &&
    longitude <= maxLng &&
    latitude >= minLat &&
    latitude <= maxLat
    ? 'valid'
    : 'outlier';
}

export function hasValidCoordinates(
  hotspot: WifiHotspot,
): hotspot is WifiHotspot & {
  latitude: number;
  longitude: number;
  coordinateStatus: 'valid';
} {
  return (
    hotspot.coordinateStatus === 'valid' &&
    hotspot.latitude !== undefined &&
    hotspot.longitude !== undefined
  );
}

export function normalizeArea(raw: string): string {
  const area = raw.trim().replace(/^(?:臺北市|台北市)\s*/, '').replace(/\s+/g, '');
  return area && !area.endsWith('區') ? `${area}區` : area;
}

export function classifyWifiHotspotType(stype: string): WifiHotspotCategory {
  if (stype.includes('公車站')) return 'bus_station';
  if (stype.includes('行政機關')) return 'government_office';
  if (stype.includes('醫院')) return 'hospital';
  if (stype.includes('商圈') || stype.includes('市集')) return 'market_shopping';
  if (stype.includes('圖書館')) return 'library';
  if (stype.includes('社區中心')) return 'community_center';
  if (stype.includes('藝文')) return 'arts_culture';
  if (stype.includes('公眾服務')) return 'public_service';
  if (stype.includes('運動')) return 'sports_venue';
  if (stype.includes('公園')) return 'park';
  if (stype.includes('大眾運輸')) return 'public_transport';
  if (stype.includes('觀光')) return 'tourist_attraction';
  if (stype.includes('遊客中心')) return 'visitor_center';
  return 'other';
}

export function filterWifiHotspots(
  hotspots: WifiHotspot[],
  filters: Filters,
): WifiHotspot[] {
  const query = filters.search.trim().toLocaleLowerCase();
  return hotspots.filter((hotspot) => {
    if (filters.taipeiCityOnly && !hotspot.isTaipeiCity) return false;
    if (filters.area && hotspot.areaZh !== filters.area) return false;
    if (filters.hotspotType && hotspot.hotspotTypeZh !== filters.hotspotType) return false;
    if (filters.agency && hotspot.agencyZh !== filters.agency) return false;
    if (filters.vendor && hotspot.vendorId !== filters.vendor) return false;
    if (!query) return true;

    return [
      hotspot.nameZh,
      hotspot.nameEn,
      hotspot.addressZh,
      hotspot.addressEn,
      hotspot.hotspotTypeZh,
      hotspot.hotspotTypeEn,
      hotspot.agencyZh,
      hotspot.agencyEn,
      hotspot.areaZh,
      hotspot.areaEn,
      hotspot.hotspotId,
    ]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(query));
  });
}

export function calculateDistanceMeters(
  userLat: number,
  userLng: number,
  itemLat: number,
  itemLng: number,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const latitudeDelta = radians(itemLat - userLat);
  const longitudeDelta = radians(itemLng - userLng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(userLat)) *
      Math.cos(radians(itemLat)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(distanceMeters: number, language: Language): string {
  if (distanceMeters < 1000) {
    const rounded = Math.round(distanceMeters);
    return language === 'zh' ? `${rounded} 公尺` : `${rounded} m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function buildWifiSummary(hotspots: WifiHotspot[]): WifiSummary {
  const countBy = <T extends string>(values: T[]) => {
    const counts = new Map<T, number>();
    values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1]);
  };

  return {
    total: hotspots.length,
    validCoordinateCount: hotspots.filter((item) => item.coordinateStatus === 'valid').length,
    taipeiCityCount: hotspots.filter((item) => item.isTaipeiCity).length,
    outsideTaipeiCount: hotspots.filter((item) => !item.isTaipeiCity).length,
    byArea: countBy(hotspots.map((item) => item.areaZh || '未提供')).map(([area, count]) => ({
      area,
      count,
    })),
    byType: countBy(hotspots.map((item) => item.hotspotTypeZh || '其他')).map(
      ([hotspotType, count]) => ({ hotspotType, count }),
    ),
    byCategory: countBy(hotspots.map((item) => item.hotspotCategory)).map(
      ([category, count]) => ({ category, count }),
    ),
    byAgency: countBy(hotspots.map((item) => item.agencyZh).filter(Boolean) as string[]).map(
      ([agency, count]) => ({ agency, count }),
    ),
  };
}

export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
