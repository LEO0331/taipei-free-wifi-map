export type CoordinateTier = 'verified' | 'assumption-tested' | 'unresolved';
export type GeographicSettings = {
  capacity: 5 | 10 | 'all'; strategy: 'marginal' | 'representation';
  evidence: 'verified' | 'assumed'; radius: 100 | 250 | 500;
  geography: 'strict' | 'flagged'; cohort: 'all' | 'B' | 'C' | 'D';
};
export type Facility = {
  id: string; source: 'B' | 'C' | 'D'; sourceRow: number; sourceHash: string; sourceFile: string;
  sourceEdition: string; sourceUrl: string; publisherRowId: string | null; name: string; address: string;
  longitude: number | null; latitude: number | null; originalCoordinates: Record<string,string>;
  declaredCRS: string | null; assumedCRS: string; sourceDistrict: string; tier: CoordinateTier;
  confidence: CoordinateTier; eligible: boolean; identityQualification: string;
  originalRecord: Record<string,string>; independentPositionEvidence: string[]; issues: string[];
  spatial: { status: 'interior' | 'boundary-adjacent' | 'exterior' | 'ambiguous' | 'invalid';
    matches: string[]; district: string | null; boundaryMeters: number | null; agrees: boolean | null;
    multipleMatches: boolean; sharedBoundary: boolean; boundarySensitivityMeters?: Record<string,boolean> };
  nearestHotspotMeters: { strict: number | null; flagged: number | null };
  neighbors: { id: string; meters: number }[];
};
export type GeographicSnapshot = {
  schemaVersion: '1.1'; versionId: string; methodVersion: 'wifi-geographic-proximity-experiment-v1';
  baselineSnapshot: { id: string; sha256: string }; geometryEdition: string; referenceUnit: string;
  sourceEditions: { id: string; sha256: string; publishedAt: string; path: string; catalogueUrl: string; license: string }[];
  transform: { source: string; target: string; operation: string; operationAccuracyMeters: number; positionalAccuracy: null };
  facilities: Facility[]; summary: {
    districts: { district: string; valid: boolean; parts: number; holes: number; roundTripMaxMeters: number }[];
    overlaps: unknown[]; repairs: unknown[];
    hotspots: { rows: number; eligible: number; duplicateCoordinateGroups: number; districtDisagreements: number; spatialStatuses: Record<string,number> };
    facilities: { rows: number; tiers: Record<string,number>; districtDisagreements: number; bySource: Record<string,Record<string,number>>; identity: unknown };
  };
  modeC: { available: false; requirements: string[] }; assumptions: string[];
};
export type GeographicManifest = { schemaVersion: '1.1'; versionId: string; methodVersion: string;
  artifacts: Record<string,{path: string; sha256: string; bytes: number}>; tools: Record<string,string> };
export type GeographicSelection = { id: string; ownReference: number; additionalReferences: number;
  marginalReferences: number; newReferenceIds: string[]; reason: 'marginal' | 'representation' | 'descriptive-only' };
export type GeographicScenario = {
  versionId: string; methodVersion: string; settings: GeographicSettings; candidateCount: number;
  capacityUsed: number;
  excludedCount: number; referenceDenominator: number; baselineProximate: number;
  newlyProximate: number; ownContributions: number; additionalContributions: number;
  optimizationAvailable: boolean; selfReferenceModel: true; selected: GeographicSelection[];
  selectedIds: string[]; districts: string[]; categories: string[]; baselineIds: string[];
  excluded: {id: string; reasons: string[]}[]; unavailableMetrics: string[];
};
