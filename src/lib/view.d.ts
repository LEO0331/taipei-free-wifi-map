import type { Language, WifiHotspot } from '../types.js';
export declare function getHotspotText(hotspot: WifiHotspot, language: Language): {
    name: string;
    type: string;
    area: string;
    address: string;
    agency: string;
};
export declare function getNearbyHotspots(hotspots: WifiHotspot[], location: {
    latitude: number;
    longitude: number;
}, radiusMeters: number): {
    hotspot: WifiHotspot;
    distance: number;
}[];
