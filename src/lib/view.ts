import type { Language, WifiHotspot } from '../types.js';
import { calculateDistanceMeters, hasValidCoordinates } from './wifi.js';

export type FilterOption = { value: string; label: string };

export function getHotspotText(hotspot: WifiHotspot, language: Language) {
  const english = language === 'en';
  return {
    name: (english && hotspot.nameEn) || hotspot.nameZh,
    type: (english && hotspot.hotspotTypeEn) || hotspot.hotspotTypeZh,
    area: (english && hotspot.areaEn) || hotspot.areaZh,
    address: (english && hotspot.addressEn) || hotspot.addressZh,
    agency: (english && hotspot.agencyEn) || hotspot.agencyZh || '',
  };
}

export function getNearbyHotspots(
  hotspots: WifiHotspot[],
  location: { latitude: number; longitude: number },
  radiusMeters: number,
) {
  return hotspots
    .filter(hasValidCoordinates)
    .map((hotspot) => ({
      hotspot,
      distance: calculateDistanceMeters(
        location.latitude,
        location.longitude,
        hotspot.latitude,
        hotspot.longitude,
      ),
    }))
    .filter(({ distance }) => distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}

export function buildFilterOptions(hotspots: WifiHotspot[], language: Language) {
  const collect = (
    getValue: (hotspot: WifiHotspot) => string | undefined,
    getEnglish: (hotspot: WifiHotspot) => string | undefined,
  ): FilterOption[] => {
    const options = new Map<string, string>();
    hotspots.forEach((hotspot) => {
      const value = getValue(hotspot);
      if (value && !options.has(value)) {
        options.set(value, language === 'en' ? getEnglish(hotspot) || value : value);
      }
    });
    return [...options]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, language === 'zh' ? 'zh-Hant' : 'en'));
  };

  return {
    areas: collect((item) => item.areaZh, (item) => item.areaEn),
    types: collect((item) => item.hotspotTypeZh, (item) => item.hotspotTypeEn),
    agencies: collect((item) => item.agencyZh, (item) => item.agencyEn),
    vendors: collect((item) => item.vendorId, () => undefined),
  };
}
