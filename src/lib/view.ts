import type { Language, WifiHotspot } from '../types.js';
import { calculateDistanceMeters } from './wifi.js';

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
    .filter(
      (hotspot) =>
        hotspot.coordinateStatus === 'valid' &&
        hotspot.latitude !== undefined &&
        hotspot.longitude !== undefined,
    )
    .map((hotspot) => ({
      hotspot,
      distance: calculateDistanceMeters(
        location.latitude,
        location.longitude,
        hotspot.latitude!,
        hotspot.longitude!,
      ),
    }))
    .filter(({ distance }) => distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}
