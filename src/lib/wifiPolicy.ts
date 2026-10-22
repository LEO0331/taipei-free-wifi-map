import type { PolicyScenario, WifiPolicySnapshot } from '../types/wifiPolicy.js';

export const POLICY_DISCLAIMER = 'Independent research POC. Investigation priority is not connectivity harm, RF coverage, digital exclusion, or approval to install, remove or relocate equipment.';

export function validateWifiPolicySnapshot(value: unknown): asserts value is WifiPolicySnapshot {
  const fail=()=>{throw new Error('Invalid or incompatible Wi-Fi policy snapshot.');};
  const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string');
  const counts=(v:unknown)=>record(v)&&Object.values(v).every(x=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0);
  if(!record(value)||value.schemaVersion!==1||typeof value.snapshotId!=='string'||!/^wifi-policy-[a-f0-9]{24}$/.test(value.snapshotId)||value.methodVersion!=='wifi-allocation-evidence-review-v1'||typeof value.candidateGrain!=='string'||!strings(value.assumptions)||!strings(value.limitations))return fail();
  if(!Array.isArray(value.sourceEditions)||!value.sourceEditions.length)return fail();
  const hashes=new Set<string>();
  for(const source of value.sourceEditions){
    if(!record(source)||!['id','datasetId','catalogueUrl','url','status'].every(key=>typeof source[key]==='string'&&source[key])||typeof source.sha256!=='string'||!/^[a-f0-9]{64}$/.test(source.sha256)||typeof source.bytes!=='number'||!Number.isSafeInteger(source.bytes)||source.bytes<=0||source.retrievedAt!==null&&typeof source.retrievedAt!=='string'||source.publishedAt!==null&&typeof source.publishedAt!=='string')return fail();
    for(const key of ['catalogueUrl','url']){
      let url: URL;
      try { url=new URL(source[key] as string); } catch { return fail(); }
      if(url.protocol!=='https:'||!['data.taipei','tsis.dbas.gov.taipei'].includes(url.hostname)||url.username||url.password)return fail();
    }
    if(source.resourceId!==null&&typeof source.resourceId!=='string')return fail();
    if(source.notes!==undefined&&!strings(source.notes)||source.exclusionReasons!==undefined&&!strings(source.exclusionReasons))return fail();
    hashes.add(source.sha256);
  }
  if(!record(value.summary)||!counts(value.summary.byTier)||!counts(value.summary.byIssue)||!Array.isArray(value.candidates)||value.summary.candidates!==value.candidates.length)return fail();
  const ids=new Set<string>();
  for(const c of value.candidates){if(!record(c)||typeof c.id!=='string'||!c.id||ids.has(c.id)||typeof c.sourceEdition!=='string'||!hashes.has(c.sourceEdition)||!['A','B','C'].includes(c.tier as string)||!['taipei-source','outside-source','unresolved'].includes(c.scope as string)||!strings(c.issues)||!c.issues.length||typeof c.identityVerified!=='boolean'||typeof c.stale!=='boolean')return fail();
    if(!['siteId','hotspotId','name','district','category'].every(k=>typeof c[k]==='string'))return fail();
    if(!['nameEn','districtEn','categoryEn'].every(k=>c[k]===undefined||typeof c[k]==='string'))return fail();
    if(!((c.latitude===null&&c.longitude===null)||(typeof c.latitude==='number'&&Number.isFinite(c.latitude)&&Math.abs(c.latitude)<=90&&typeof c.longitude==='number'&&Number.isFinite(c.longitude)&&Math.abs(c.longitude)<=180)))return fail();ids.add(c.id);}
  if(!record(value.modes))return fail();for(const mode of ['A','B','C']){const gate=value.modes[mode];if(!record(gate)||typeof gate.available!=='boolean'||!strings(gate.reasons)||!strings(gate.requirements))return fail();}
  if(!record(value.reconciliation)||typeof value.reconciliation.identityRule!=='string')return fail();
  for(const key of ['added','removed','changedCoordinates','changedCategories','changedMetadata','ambiguous']){const count=value.reconciliation[key];if(typeof count!=='number'||!Number.isSafeInteger(count)||count<0)return fail();}
  for(const key of ['legacy','current']){
    const audit=value.reconciliation[key];
    if(!record(audit)||!counts(audit.byDistrict)||!counts(audit.byCategory)||!counts(audit.byAgency))return fail();
    for(const field of ['rows','uniqueSiteIds','uniqueHotspotIds','duplicateSiteIds','duplicateHotspotIds','missingSiteIds','missingHotspotIds','invalidCoordinates','taipeiSourceRows','outsideSourceRows']){
      const count=audit[field];if(typeof count!=='number'||!Number.isSafeInteger(count)||count<0)return fail();
    }
  }
}

export function createWifiPolicyJsonExport(snapshot: WifiPolicySnapshot, scenario: PolicyScenario): string {
  if (scenario.snapshotId !== snapshot.snapshotId) throw new Error('Scenario snapshot mismatch.');
  return JSON.stringify({
    snapshotId: snapshot.snapshotId, sourceEditions: snapshot.sourceEditions, methodVersion: snapshot.methodVersion,
    candidateGrain: snapshot.candidateGrain, objective: scenario.objective,
    eligibilityRules: 'Strict: unique site+hotspot pair and published Taipei scope; broader: inspectable composite source-row identity. Stale sources require explicit inclusion.',
    filters: { district: scenario.settings.district ?? null, category: scenario.settings.category ?? null },
    assumptions: scenario.assumptions, limitations: snapshot.limitations, disclaimer: POLICY_DISCLAIMER, scenario,
  }, null, 2);
}

export function safePolicyCsvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createWifiPolicyCsvExport(snapshot: WifiPolicySnapshot, scenario: PolicyScenario): string {
  const provenance = createWifiPolicyJsonExport(snapshot, { ...scenario, selected: [] });
  const header = ['snapshot_id', 'candidate_id', 'site_id', 'hotspot_id', 'name', 'district', 'category', 'tier', 'issues', 'source_edition', 'decision_metadata_json'];
  const rows = scenario.selected.map((c,index) => [snapshot.snapshotId, c.id, c.siteId, c.hotspotId, c.name, c.district, c.category, c.tier, c.issues.join('|'), c.sourceEdition, index===0?provenance:'']);
  // Always retain governance metadata, including in an empty selection.
  if (!rows.length) rows.push([snapshot.snapshotId, '', '', '', '', '', '', '', '', '', provenance]);
  return '\uFEFF' + [header, ...rows].map(row => row.map(safePolicyCsvCell).join(',')).join('\r\n');
}
