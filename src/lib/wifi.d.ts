import type { CoordinateStatus, Filters, Language, WifiHotspot, WifiHotspotCategory, WifiSummary } from '../types.js';
export declare const TAIPEI_WIFI_BOUNDS: {
    readonly minLng: 121.4;
    readonly maxLng: 121.72;
    readonly minLat: 24.88;
    readonly maxLat: 25.25;
};
export declare const TAIPEI_CITY_DISTRICTS: readonly ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"];
export declare function normalizeColumnName(raw: string): string;
export declare function parseCoordinate(raw: unknown): number | undefined;
export declare function validateWifiCoordinate(longitude?: number, latitude?: number): CoordinateStatus;
export declare function normalizeArea(raw: string): string;
export declare function classifyWifiHotspotType(stype: string): WifiHotspotCategory;
export declare function filterWifiHotspots(hotspots: WifiHotspot[], filters: Filters): WifiHotspot[];
export declare function calculateDistanceMeters(userLat: number, userLng: number, itemLat: number, itemLng: number): number;
export declare function formatDistance(distanceMeters: number, language: Language): string;
export declare function buildWifiSummary(hotspots: WifiHotspot[]): WifiSummary;
export declare function getGoogleMapsUrl(latitude: number, longitude: number): string;
