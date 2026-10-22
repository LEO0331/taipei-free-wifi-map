export type PolicySourceEdition = {
  id: string; datasetId: string; resourceId: string | null; catalogueUrl: string; url: string;
  publishedAt: string | null; retrievedAt: string | null; status: string;
  retrievalDate?: string | null; retrievalPrecision?: string; publisher?: string; license?: string; eligibility?: string; exclusionReasons?: string[];
  file?: string; sha256?: string; bytes?: number; notes?: string[];
};
export type PolicyCandidate = {
  id: string; siteId: string; hotspotId: string; name: string; district: string; category: string;
  latitude: number | null; longitude: number | null; tier: 'A' | 'B' | 'C'; issues: string[];
  identityVerified: boolean; stale: boolean; sourceEdition: string;
  scope: 'taipei-source' | 'outside-source' | 'unresolved';
};
export type PolicyGate = { available: boolean; reasons: string[]; requirements: string[] };
export type InventoryAudit = {
  rows: number; uniqueSiteIds: number; uniqueHotspotIds: number; duplicateSiteIds: number;
  duplicateHotspotIds: number; missingSiteIds: number; missingHotspotIds: number;
  invalidCoordinates: number; taipeiSourceRows: number; outsideSourceRows: number;
  byDistrict: Record<string, number>; byCategory: Record<string, number>; byAgency: Record<string, number>;
};
export type PolicyReconciliation = {
  identityRule: string; legacy: InventoryAudit; current: InventoryAudit; added: number; removed: number;
  changedCoordinates: number; changedCategories: number; changedMetadata: number; ambiguous: number;
};
export type WifiPolicySnapshot = {
  schemaVersion: 1; snapshotId: string; methodVersion: string; candidateGrain: string;
  sourceEditions: PolicySourceEdition[]; reconciliation: PolicyReconciliation;
  summary: { candidates: number; byTier: Record<string, number>; byIssue: Record<string, number> };
  candidates: PolicyCandidate[]; modes: { A: PolicyGate; B: PolicyGate; C: PolicyGate };
  assumptions: string[]; limitations: string[];
};
export type PolicyScenarioSettings = {
  capacity: 5 | 10 | 'all'; strategy: 'evidence' | 'balanced'; eligibility: 'strict' | 'broader'; includeStale: boolean;
  district?: string; category?: string;
};
export type PolicyScenario = {
  snapshotId: string; objective: string; settings: PolicyScenarioSettings; eligibleCount: number;
  excludedCount: number; exclusionReasons: Record<string, number>; capacityUsed: number;
  selectedIds: string[]; selected: PolicyCandidate[]; districts: string[]; categories: string[];
  verifiedMetrics: string[]; unavailableMetrics: string[]; assumptions: string[];
};
