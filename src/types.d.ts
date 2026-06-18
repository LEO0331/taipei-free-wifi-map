export type CoordinateStatus = 'valid' | 'missing' | 'outlier';
export type WifiHotspotCategory = 'bus_station' | 'government_office' | 'hospital' | 'market_shopping' | 'library' | 'community_center' | 'arts_culture' | 'public_service' | 'sports_venue' | 'park' | 'public_transport' | 'tourist_attraction' | 'visitor_center' | 'other';
export type WifiHotspot = {
    id: string;
    siteId: string;
    agencyCode?: string;
    ministryZh?: string;
    agencyZh?: string;
    hotspotTypeZh: string;
    hotspotCategory: WifiHotspotCategory;
    nameZh: string;
    vendorId?: string;
    hotspotId?: string;
    zipCode?: string;
    cityZh?: string;
    areaZh: string;
    addressZh: string;
    latitude?: number;
    longitude?: number;
    coordinateStatus: CoordinateStatus;
    isTaipeiCity: boolean;
    ministryEn?: string;
    agencyEn?: string;
    hotspotTypeEn?: string;
    nameEn?: string;
    cityEn?: string;
    areaEn?: string;
    addressEn?: string;
    source: string;
};
export type WifiSummary = {
    total: number;
    validCoordinateCount: number;
    taipeiCityCount: number;
    outsideTaipeiCount: number;
    byArea: Array<{
        area: string;
        count: number;
    }>;
    byType: Array<{
        hotspotType: string;
        count: number;
    }>;
    byCategory: Array<{
        category: WifiHotspotCategory;
        count: number;
    }>;
    byAgency: Array<{
        agency: string;
        count: number;
    }>;
};
export type Filters = {
    search: string;
    area: string;
    hotspotType: string;
    agency: string;
    vendor: string;
    taipeiCityOnly: boolean;
};
export type ConversionReport = {
    sourceFile: string;
    convertedAt: string;
    source: string;
    inputCount: number;
    outputCount: number;
    validCoordinateCount: number;
    missingCoordinateCount: number;
    outlierCoordinateCount: number;
    taipeiCityCount: number;
    outsideTaipeiCount: number;
    notes: string[];
};
export type Language = 'zh' | 'en';
