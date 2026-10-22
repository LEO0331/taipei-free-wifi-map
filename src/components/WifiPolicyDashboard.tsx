import { useEffect, useMemo, useState } from 'react';
import type { Language } from '../types';
import type { PolicyScenarioSettings, WifiPolicySnapshot } from '../types/wifiPolicy';
import { compareWifiPolicyScenarios, runWifiPolicyScenario } from '../lib/wifiPolicyScenarios';
import { createWifiPolicyCsvExport, createWifiPolicyJsonExport, validateWifiPolicySnapshot } from '../lib/wifiPolicy';
import './WifiPolicyDashboard.css';

const gateExplanation = {
  zh: {
    B: '尚未取得通過查核的公共設施身分與座標基準／精度，以及行政區空間歸屬，因此不計算幾何鄰近、不產生假設配置名單。保留官方設施原始資料供後續查核。',
    C: '目前缺乏可對應同一站點與期間的運作狀態、連線品質、使用量，以及有效的需求／人口分母，因此不建立服務品質或數位排除排名。',
    monitoring: 'C 層級只表示較低優先的文件追蹤問題，仍需查核邊界與現地資訊；不表示設備正在運作或服務品質良好。',
  },
  en: {
    B: 'Public-facility identities, coordinate datum/precision and spatial district attribution have not passed validation. Geometric proximity and hypothetical allocation shortlists are therefore unavailable; original official facility records remain retained for audit.',
    C: 'There is no accepted evidence linking site identities and comparable periods to operations, connection quality, usage and valid demand/population denominators. No service-quality or digital-exclusion ranking is produced.',
    monitoring: 'Tier C means lower-priority documentation monitoring. Boundaries and site conditions still require verification; the tier does not establish operation or good service quality.',
  },
};

const words = {
  zh: {
    title: '臺北市公共 Wi-Fi 資源配置與數位近用決策支援', scope: 'Policy #8 · 證據審查 POC',
    question: '有限的調查資源，應先查核哪些公開熱點紀錄？',
    intro: '此研究分配的是來源查核與現地調查名額。公開位置紀錄不能證明設備運作、訊號範圍、網路品質、居民需求或數位排除。',
    loading: '正在載入獨立政策快照…', error: '無法載入相容的政策快照。請連線後重試。', retry: '重試',
    sources: '官方來源健康與版本', edition: '來源版本', status: '擷取狀態', publication: '來源發布日期', acquisition: '實際擷取日期', unknown: '未知／未建立',
    reconciliation: '保留版與目前版目錄比對', metric: '檢查項目', legacy: '保留版', current: '目前驗證版', rows: '原始列數', sites: '唯一 SITE_ID', hotspots: '唯一 HOTSPOT_ID', duplicateSites: '重複 SITE_ID 數', duplicateHotspots: '重複 HOTSPOT_ID 數', invalid: '無效座標列', taipei: '來源標示臺北列', outside: '來源標示市外列',
    added: '新增紀錄', removed: '未再出現', coordinates: '座標改變', categories: '分類改變', metadata: '其他欄位改變', ambiguous: '身分對應不明', reconcileNote: '目錄差異不是設備安裝或移除證據。來源行政區欄位不等同官方邊界驗證。',
    quality: '資料品質與審查層級', tierA: 'A · 優先證據查核', tierB: 'B · 文件查核', tierC: 'C · 持續觀察',
    controls: '調查情境', mode: '分析目標', modeA: 'A · 目錄與證據品質審查', modeB: 'B · 公共設施幾何鄰近研究', modeC: 'C · 運作品質與數位近用成果', unavailable: '證據不足 · 未開放',
    capacity: '調查名額', all: '全部符合資格', strategy: '選取策略', evidence: '證據缺口優先', balanced: '設施分類輪替審查', eligibility: '身分資格', strict: '嚴格：已驗證身分', broader: '較廣：保留可查核歧義', stale: '納入未對應目前版的保留紀錄', district: '來源行政區', category: '來源分類', any: '全部',
    selected: '已選查核名額', eligible: '符合資格', excluded: '排除紀錄', represented: '行政區／分類', comparison: '策略比較與敏感度', scenario: '情境', changed: '與目前清單不同的 ID 數', same: '與目前清單相同',
    candidateTitle: '實際來源衍生的調查清單', candidate: '來源身分與名稱', geography: '來源行政區／分類', reason: '層級與查核問題', trace: '追溯欄位', page: '頁', previous: '上一頁', next: '下一頁', empty: '此設定沒有符合資格的調查候選。',
    exports: '匯出目前決策紀錄', exportNote: '包含目前設定、實際選取 ID、來源版本、雜湊、排除理由與使用限制。匯出不是設備設置建議。',
    limits: '假設、缺漏證據與責任使用', requirements: '尚需證據', assumptions: '模型假設', limitations: '已知限制', exclusions: '目前排除原因', machine: '來源欄位與稽核代碼保留原文，以利核對；中文來源名稱不推測翻譯。', full: '檢視完整有序 ID',
  },
  en: {
    title: 'Taipei Public Wi-Fi Allocation & Digital Inclusion Decision Support', scope: 'Policy #8 · Evidence-review POC',
    question: 'Which published records should limited investigation resources verify first?',
    intro: 'This research allocates source-verification and field-investigation slots. Published location records establish neither operation, signal reach, quality, resident demand nor digital exclusion.',
    loading: 'Loading the independent policy snapshot…', error: 'Unable to load a compatible policy snapshot. Reconnect and retry.', retry: 'Retry',
    sources: 'Official source health and editions', edition: 'Source edition', status: 'Acquisition status', publication: 'Publisher date', acquisition: 'Actual retrieval date', unknown: 'Unknown / not established',
    reconciliation: 'Retained versus current inventory reconciliation', metric: 'Audit measure', legacy: 'Retained edition', current: 'Current validated edition', rows: 'Raw rows', sites: 'Unique SITE_ID', hotspots: 'Unique HOTSPOT_ID', duplicateSites: 'Duplicated SITE_ID values', duplicateHotspots: 'Duplicated HOTSPOT_ID values', invalid: 'Invalid-coordinate rows', taipei: 'Source-labelled Taipei rows', outside: 'Source-labelled outside rows',
    added: 'Added records', removed: 'No longer listed', coordinates: 'Coordinate changes', categories: 'Category changes', metadata: 'Other metadata changes', ambiguous: 'Ambiguous identities', reconcileNote: 'Inventory differences do not prove equipment installation or removal. Source district fields do not constitute official boundary validation.',
    quality: 'Data quality and review tiers', tierA: 'A · Primary evidence verification', tierB: 'B · Documentation review', tierC: 'C · Monitoring',
    controls: 'Investigation scenario', mode: 'Analytical objective', modeA: 'A · Inventory and evidence-quality review', modeB: 'B · Public-facility geometric proximity', modeC: 'C · Operations and digital-inclusion outcomes', unavailable: 'Evidence missing · unavailable',
    capacity: 'Investigation slots', all: 'All eligible', strategy: 'Selection strategy', evidence: 'Evidence gaps first', balanced: 'Facility-category round-robin review', eligibility: 'Identity eligibility', strict: 'Strict: verified identity', broader: 'Broader: inspectable ambiguity', stale: 'Include retained records without a current counterpart', district: 'Source district', category: 'Source category', any: 'All',
    selected: 'Investigation slots used', eligible: 'Eligible candidates', excluded: 'Excluded records', represented: 'Districts / categories', comparison: 'Strategy comparison and sensitivity', scenario: 'Scenario', changed: 'IDs differing from current shortlist', same: 'Equivalent to current shortlist',
    candidateTitle: 'Actual source-derived investigation shortlist', candidate: 'Source identity and name', geography: 'Source district / category', reason: 'Tier and review questions', trace: 'Traceability', page: 'Page', previous: 'Previous', next: 'Next', empty: 'No candidates satisfy this configuration.',
    exports: 'Export the current decision record', exportNote: 'Includes the current configuration, actual selected IDs, source editions, hashes, exclusion reasons and limitations. Exports are not installation recommendations.',
    limits: 'Assumptions, missing evidence and responsible use', requirements: 'Required evidence', assumptions: 'Model assumptions', limitations: 'Known limitations', exclusions: 'Current exclusion reasons', machine: 'Source fields and audit codes retain their original wording for verification; Chinese source names are not guessed translations.', full: 'Inspect complete ordered IDs',
  },
};

const issueDescriptions: Record<string, { zh: string; en: string }> = {
  'boundary-and-operation-unverified': { zh: '核對官方邊界與現地服務資訊；來源目錄無法建立運作證據。', en: 'Verify administrative boundaries and site service evidence; directory presence does not establish operation.' },
  'changed-category': { zh: '比對兩版分類欄位，確認文件更正或分類定義改變。', en: 'Compare category fields across editions and verify correction or definition changes.' },
  'source-metadata-changed': { zh: '核對名稱、機關或其他文件欄位的版本差異，確認發布更正原因。', en: 'Verify edition differences in names, agencies or other metadata and the reason for publication corrections.' },
  'changed-coordinates': { zh: '比對兩版原始座標與位置資料，確認異動原因。', en: 'Compare original coordinates and location evidence across editions to explain the change.' },
  'new-source-relationship': { zh: '核對新增來源身分與發布範圍；不能據此推定設備新設。', en: 'Verify the new source identity and publication scope; this does not establish new installation.' },
  'no-current-counterpart': { zh: '查核目前版未再出現的原因；不能據此推定設備移除。', en: 'Investigate why no current counterpart is listed; this does not establish equipment removal.' },
  'outside-or-unresolved-source-scope': { zh: '核對來源行政區與研究範圍，保留市外及未確認紀錄。', en: 'Verify source administrative labels and research scope while retaining outside or unresolved rows.' },
};

function download(body: string, format: 'json' | 'csv', snapshotId: string) {
  const url = URL.createObjectURL(new Blob([body], { type: format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `wifi-policy-${snapshotId}.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function WifiPolicyDashboard({ language }: { language: Language }) {
  const t = words[language];
  const [snapshot, setSnapshot] = useState<WifiPolicySnapshot>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<'A' | 'B' | 'C'>('A');
  const [settings, setSettings] = useState<PolicyScenarioSettings>({ capacity: 5, strategy: 'evidence', eligibility: 'strict', includeStale: false, district: '', category: '' });
  const [page, setPage] = useState(0);
  const [showIds, setShowIds] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch(`${import.meta.env.BASE_URL}data/wifi-policy/snapshot.json`, { signal: controller.signal, cache: 'no-cache' })
      .then(async response => {
        if (!response.ok) throw new Error('snapshot');
        const data: unknown = await response.json();
        validateWifiPolicySnapshot(data);
        setSnapshot(data);
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);
  const scenario = useMemo(() => snapshot ? runWifiPolicyScenario(snapshot, settings) : undefined, [snapshot, settings]);
  const comparisons = useMemo(() => snapshot && scenario ? [
    ...([5, 10, 'all'] as const).map(capacity => ({ label: `${t.capacity}: ${capacity === 'all' ? t.all : capacity}`, settings: { ...settings, capacity } })),
    { label: settings.strategy === 'evidence' ? t.balanced : t.evidence, settings: { ...settings, strategy: settings.strategy === 'evidence' ? 'balanced' as const : 'evidence' as const } },
    { label: settings.eligibility === 'strict' ? t.broader : t.strict, settings: { ...settings, eligibility: settings.eligibility === 'strict' ? 'broader' as const : 'strict' as const } },
    { label: `${t.stale}: ${!settings.includeStale}`, settings: { ...settings, includeStale: !settings.includeStale } },
  ].map(item => { const result = runWifiPolicyScenario(snapshot, item.settings); return { ...item, result, difference: compareWifiPolicyScenarios(scenario, result) }; }) : [], [snapshot, scenario, settings, t]);
  const update = (change: Partial<PolicyScenarioSettings>) => { setSettings(current => ({ ...current, ...change })); setPage(0); };
  if (error) return <section className="policy-dashboard"><p className="error-message" role="alert">{t.error}</p><button className="primary-button" onClick={() => setAttempt(attempt + 1)}>{t.retry}</button></section>;
  if (!snapshot || !scenario) return <p className="loading" role="status">{t.loading}</p>;
  const metrics = [ ['rows', t.rows], ['uniqueSiteIds', t.sites], ['uniqueHotspotIds', t.hotspots], ['duplicateSiteIds', t.duplicateSites], ['duplicateHotspotIds', t.duplicateHotspots], ['invalidCoordinates', t.invalid], ['taipeiSourceRows', t.taipei], ['outsideSourceRows', t.outside] ] as const;
  const pageCount = Math.max(1, Math.ceil(scenario.selected.length / 20));
  return <section className="policy-dashboard content-section">
    <div className="section-heading"><div><span className="section-number">08</span><h2>{t.title}</h2></div></div>
    <p className="eyebrow">{t.scope}</p><h3 className="policy-question">{t.question}</h3><p className="policy-intro">{t.intro}</p>
    <p className="policy-version"><b>{snapshot.snapshotId}</b> · {snapshot.methodVersion} · {snapshot.candidateGrain}</p>
    <section className="policy-card"><h3>{t.controls}</h3><div className="policy-controls">
      <label>{t.mode}<select value={mode} onChange={event => setMode(event.target.value as 'A' | 'B' | 'C')}><option value="A">{t.modeA}</option><option value="B">{t.modeB}</option><option value="C">{t.modeC}</option></select></label>
      <label>{t.capacity}<select value={settings.capacity} onChange={event => update({ capacity: event.target.value === 'all' ? 'all' : Number(event.target.value) as 5 | 10 })}><option value="5">5</option><option value="10">10</option><option value="all">{t.all}</option></select></label>
      <label>{t.strategy}<select value={settings.strategy} onChange={event => update({ strategy: event.target.value as 'evidence' | 'balanced' })}><option value="evidence">{t.evidence}</option><option value="balanced">{t.balanced}</option></select></label>
      <label>{t.eligibility}<select value={settings.eligibility} onChange={event => update({ eligibility: event.target.value as 'strict' | 'broader' })}><option value="strict">{t.strict}</option><option value="broader">{t.broader}</option></select></label>
      <label>{t.district}<select value={settings.district} onChange={event => update({ district: event.target.value })}><option value="">{t.any}</option>{[...new Set(snapshot.candidates.map(candidate => candidate.district))].filter(Boolean).sort().map(value => <option key={value}>{value}</option>)}</select></label>
      <label>{t.category}<select value={settings.category} onChange={event => update({ category: event.target.value })}><option value="">{t.any}</option>{[...new Set(snapshot.candidates.map(candidate => candidate.category))].filter(Boolean).sort().map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="policy-checkbox"><input type="checkbox" checked={settings.includeStale} onChange={event => update({ includeStale: event.target.checked })} />{t.stale}</label>
    </div></section>
    {mode !== 'A' && <section className="policy-card policy-gate" role="status"><h3>{mode === 'B' ? t.modeB : t.modeC} — {t.unavailable}</h3><p>{gateExplanation[language][mode]}</p><ul>{snapshot.modes[mode].reasons.map(reason => <li key={reason}>{reason}</li>)}</ul><h4>{t.requirements}</h4><ul>{snapshot.modes[mode].requirements.map(reason => <li key={reason}>{reason}</li>)}</ul><p>{t.modeA}</p></section>}
    {mode === 'A' && <>
      <div className="summary-grid policy-summary">{[[t.selected, scenario.capacityUsed], [t.eligible, scenario.eligibleCount], [t.excluded, scenario.excludedCount], [t.represented, `${scenario.districts.length} / ${scenario.categories.length}`]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      <section className="policy-card"><h3>{t.candidateTitle}</h3><p>{t.machine}</p><div className="policy-table-scroll"><table><thead><tr><th>#</th><th>{t.candidate}</th><th>{t.geography}</th><th>{t.reason}</th><th>{t.trace}</th></tr></thead><tbody>{scenario.selected.slice(page * 20, (page + 1) * 20).map((candidate, index) => <tr key={candidate.id}><td>{page * 20 + index + 1}</td><td><b>{candidate.name}</b><code>{candidate.id}</code></td><td>{candidate.district || '—'}<br />{candidate.category || '—'}</td><td><span className={`policy-tier tier-${candidate.tier}`}>{candidate.tier}</span><ul>{candidate.issues.map(issue => <li key={issue}>{issueDescriptions[issue]?.[language] || issue}<code>{issue}</code></li>)}</ul></td><td><code>SITE_ID: {candidate.siteId || '—'}<br />HOTSPOT_ID: {candidate.hotspotId || '—'}<br />{candidate.sourceEdition}</code>{candidate.latitude !== null && candidate.longitude !== null ? `${candidate.latitude}, ${candidate.longitude}` : t.unknown}</td></tr>)}</tbody></table></div>{scenario.selected.length === 0 && <p className="empty-state">{t.empty}</p>}<div className="policy-pagination"><button disabled={page === 0} onClick={() => setPage(page - 1)}>{t.previous}</button><span>{t.page} {page + 1} / {pageCount}</span><button disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>{t.next}</button></div><details onToggle={event => setShowIds(event.currentTarget.open)}><summary>{t.full}</summary>{showIds && <ol className="policy-id-list">{scenario.selectedIds.map(id => <li key={id}><code>{id}</code></li>)}</ol>}</details></section>
      <section className="policy-card"><h3>{t.comparison}</h3><div className="policy-table-scroll"><table><thead><tr><th>{t.scenario}</th><th>{t.eligible}</th><th>{t.selected}</th><th>{t.represented}</th><th>{t.changed}</th></tr></thead><tbody>{comparisons.map(item => <tr key={item.label}><td>{item.label}</td><td>{item.result.eligibleCount}</td><td>{item.result.capacityUsed}</td><td>{item.result.districts.length} / {item.result.categories.length}</td><td>{item.difference.equivalent ? t.same : item.difference.added.length + item.difference.removed.length}</td></tr>)}</tbody></table></div></section>
      <section className="policy-card"><h3>{t.exports}</h3><p>{t.exportNote}</p><div className="policy-actions"><button onClick={() => download(createWifiPolicyJsonExport(snapshot, scenario), 'json', snapshot.snapshotId)}>JSON</button><button onClick={() => download(createWifiPolicyCsvExport(snapshot, scenario), 'csv', snapshot.snapshotId)}>CSV</button></div></section>
    </>}
    <section className="policy-card"><h3>{t.quality}</h3><p>{gateExplanation[language].monitoring}</p><div className="policy-quality">{(['A', 'B', 'C'] as const).map(tier => <div key={tier}><b>{tier === 'A' ? t.tierA : tier === 'B' ? t.tierB : t.tierC}</b><strong>{snapshot.summary.byTier[tier] || 0}</strong></div>)}</div><details><summary>{t.exclusions}</summary><ul>{Object.entries(scenario.exclusionReasons).map(([key, value]) => <li key={key}>{key}: {value}</li>)}</ul></details><details><summary>{t.reason}</summary><ul>{Object.entries(snapshot.summary.byIssue).map(([key, value]) => <li key={key}>{key}: {value}</li>)}</ul></details></section>
    <section className="policy-card"><h3>{t.reconciliation}</h3><p>{t.reconcileNote}</p><div className="policy-table-scroll"><table><thead><tr><th>{t.metric}</th><th>{t.legacy}</th><th>{t.current}</th></tr></thead><tbody>{metrics.map(([key, label]) => <tr key={key}><th>{label}</th><td>{snapshot.reconciliation.legacy[key].toLocaleString()}</td><td>{snapshot.reconciliation.current[key].toLocaleString()}</td></tr>)}</tbody></table></div><div className="policy-changes">{[['added', t.added], ['removed', t.removed], ['changedCoordinates', t.coordinates], ['changedCategories', t.categories], ['changedMetadata', t.metadata], ['ambiguous', t.ambiguous]].map(([key, label]) => <span key={key}>{label}: <b>{snapshot.reconciliation[key as 'added']}</b></span>)}</div><p>{snapshot.reconciliation.identityRule}</p></section>
    <section className="policy-card"><h3>{t.sources}</h3>{snapshot.sourceEditions.map(source => <article className="policy-source" key={source.id}><h4>{source.id}</h4><dl><dt>{t.status}</dt><dd>{source.status}</dd><dt>{language === 'zh' ? '發布者／授權' : 'Publisher / licence'}</dt><dd>{source.publisher || t.unknown}<br />{source.license || t.unknown}</dd><dt>{t.eligibility}</dt><dd>{source.eligibility || t.unknown}{source.exclusionReasons?.map(reason => <p key={reason}>{reason}</p>)}</dd><dt>{t.publication}</dt><dd>{source.publishedAt || t.unknown}</dd><dt>{t.acquisition}</dt><dd>{source.retrievedAt || source.retrievalDate || t.unknown}{source.retrievalPrecision && <code>{source.retrievalPrecision}</code>}</dd><dt>Dataset / resource ID</dt><dd>{source.datasetId} / {source.resourceId || '—'}</dd><dt>Bytes / SHA-256</dt><dd>{source.bytes ?? '—'}<code>{source.sha256 || t.unknown}</code></dd></dl><a href={source.catalogueUrl} target="_blank" rel="noreferrer">{t.edition}</a> · <a href={source.url} target="_blank" rel="noreferrer">{language === 'zh' ? '官方資源' : 'Official resource'}</a>{source.notes?.map(note => <p key={note}>{note}</p>)}</article>)}</section>
    <section className="policy-card"><h3>{t.limits}</h3><h4>{t.assumptions}</h4><ul>{snapshot.assumptions.map(item => <li key={item}>{item}</li>)}</ul><h4>{t.limitations}</h4><ul>{snapshot.limitations.map(item => <li key={item}>{item}</li>)}</ul>{(['B', 'C'] as const).map(gate => <details key={gate}><summary>{gate === 'B' ? t.modeB : t.modeC} — {t.unavailable}</summary><p>{gateExplanation[language][gate]}</p><ul>{snapshot.modes[gate].reasons.map(item => <li key={item}>{item}</li>)}</ul><h4>{t.requirements}</h4><ul>{snapshot.modes[gate].requirements.map(item => <li key={item}>{item}</li>)}</ul></details>)}</section>
  </section>;
}
