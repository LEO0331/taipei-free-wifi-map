import type { PolicySourceEdition } from './wifiPolicy.js';

export type GeographicEvidenceTier = 'verified' | 'assumption-tested' | 'unresolved';
export type GeographicSpatialValidation = {
  status: 'interior' | 'boundary' | 'exterior' | 'ambiguous' | 'invalid';
  district: string | null; matches: string[]; distanceToBoundaryMeters: number | null;
  sourceDistrictAgrees: boolean | null; geometryVersion: string; transformationVersion: string;
};
export type GeographicFacility = {
  id: string; source: 'B' | 'C' | 'D'; sourceEdition: string; sourceFilename: string; sourceSha256: string;
  rowIdentity: string; name: string; address: string; sourceDistrict: string;
  originalCoordinates: { x: string; y: string; xField: string; yField: string };
  sourceCrs: string | null; assumedCrs: string | null; longitude: number | null; latitude: number | null;
  evidenceTier: GeographicEvidenceTier; identityQualified: boolean; spatial: GeographicSpatialValidation;
  warnings: string[]; exclusionReasons: string[]; rawRecord: Record<string, string>;
  independentEvidence: string[];
  sourceDistrictOrigin?: 'published-column' | 'address-derived' | 'missing';
  coordinateChecks?: Record<string, unknown>;
  identityDiagnostics?: string[];
};
export type GeographicHotspot = {
  id: string; sourceIds: string[]; longitude: number; latitude: number; sourceDistrict: string;
  sourceScope: 'taipei-source' | 'outside-source' | 'unresolved'; spatial: GeographicSpatialValidation;
};
export type GeographicSnapshot = {
  schemaVersion: 1; snapshotId: string; methodVersion: 'wifi-geographic-proximity-experiment-v1';
  baseline: { snapshotId: string; sha256: string }; sourceEditions: PolicySourceEdition[];
  geometry: { version: string; sha256: string; file: string; sourceSha256: string; transformationVersion: string; districtCount: number };
  facilities: GeographicFacility[]; hotspots: GeographicHotspot[];
  distances: { facilityIds: string[]; facilityMeters: number[][]; nearestHotspot: Record<string, { strict: GeographicNearest; flagged: GeographicNearest; strictByTolerance: Record<'10'|'25'|'50', GeographicNearest> }> };
  summary: Record<string, number>; assumptions: string[]; limitations: string[];
  referenceUnit: string; candidateEqualsReference: true; modeC: { available: false; requirements: string[] };
};
export type GeographicNearest = { distanceMeters: number | null; hotspotIds: string[] };
export type GeographicScenarioSettings = {
  evidence: 'verified-only' | 'assumption-tested'; radiusMeters: 100 | 250 | 500;
  boundary: 'strict' | 'flagged'; boundaryToleranceMeters: 10 | 25 | 50;
  cohort: 'B' | 'C' | 'D' | 'all'; capacity: 5 | 10 | 'all'; strategy: 'marginal' | 'representation';
};
export type GeographicSelection = {
  id: string; order: number; reason: 'marginal-additional-reference' | 'district-representation' | 'descriptive-stable-order';
  selfContribution: number; additionalContribution: number; totalContribution: number;
  newlyAssociatedReferenceIds: string[]; nearestHotspot: GeographicNearest;
};
export type GeographicScenario = {
  snapshotId: string; geometryVersion: string; methodVersion: string; settings: GeographicScenarioSettings;
  candidatePopulation: number; eligibleCount: number; excludedCount: number; exclusionReasons: Record<string, number>;
  referenceDenominator: number; baselineProximateIds: string[]; baselineProximityCount: number;
  selectedIds: string[]; selected: GeographicFacility[]; selections: GeographicSelection[]; capacityUsed: number;
  incrementalReferenceIds: string[]; incrementalReferenceCount: number; additionalNonSelfCount: number;
  optimizationAvailable: boolean; optimizationUnavailableReasons: string[]; districts: string[]; categories: string[];
  assumptions: string[]; unavailableMetrics: string[];
};
