import type { Language } from '../types.js';
import type { PolicyCandidate } from '../types/wifiPolicy.js';

// Display translations only. Original evidence, filter values and exports stay unchanged.
const textPairs: Array<[string, string]> = [
  ['Source edition + SITE_ID + HOTSPOT_ID + canonical row SHA-256 prefix + duplicate occurrence', '來源版本＋SITE_ID＋HOTSPOT_ID＋標準化列雜湊前綴＋重複序號'],
  ['Exact unique SITE_ID + HOTSPOT_ID pairs only; no name joins. Changes describe published records, not physical events.', '僅以唯一的 SITE_ID 與 HOTSPOT_ID 精確組合對帳，不依名稱配對。異動描述的是出版紀錄，而非設備實體事件。'],
  ['Published source rows support evidence investigation.', '已公布的來源紀錄可支援證據查核。'],
  ['Facility sources B/D have no publisher facility IDs or authoritative CRS/datum/precision contract; C projected X/Y semantics require validation.', '設施來源 B／D 尚缺發布者設施識別碼及權威座標參考系統、基準與精度契約；來源 C 的投影 X/Y 座標語意仍待驗證。'],
  ['Official TWD97 district polygons are retained but reprojection/spatial attribution is not validated.', '已保留官方 TWD97 行政區多邊形，但尚未驗證座標轉換及空間歸屬。'],
  ['Accepted official facility identity and coordinate contract', '通過查核的官方設施身分與座標契約'],
  ['Validated district attribution and eligible reference population', '經驗證的行政區歸屬與合格參考設施母體'],
  ['No accepted site-level operational, quality, usage, population or demand evidence.', '目前缺少通過查核的站點營運、品質、使用量、人口或需求證據。'],
  ['Operational identity continuity', '營運紀錄中的站點身分連續性'],
  ['Comparable time windows', '可比較的觀測期間'],
  ['Validated service/demand denominators', '經驗證的服務或需求分母'],
  ['Published Taipei county/district fields establish source administrative labels only; they do not establish polygon membership.', '來源的縣市與行政區欄位僅代表公布的行政標籤，不能證明點位落在行政區多邊形內。'],
  ['Tier precedence: A primary identity/version/coordinate verification, then B documentation, then C monitoring.', '分級優先順序：A 為主要身分、版本或座標查核，其次為 B 文件查核，最後為 C 持續追蹤。'],
  ['Investigation slots are not equipment allocation approvals.', '調查名額不代表設備配置核准。'],
  ['No RF coverage, uptime, speed, demand or digital exclusion is measured.', '本研究未量測無線訊號涵蓋、可用時間、速度、需求或數位排除。'],
  ['Acquisition time for the legacy source is unknown; filesystem timestamps are not retrieval evidence.', '保留舊版來源的取得時間不明；檔案系統時間戳記不能作為下載證據。'],
  ['Source edition changes are not proof of installations or removals.', '來源版本異動不能證明設備安裝或移除。'],
  ['All rows are retained; broader scope admits records for investigation without certifying their coordinates.', '所有來源列均保留；較寬範圍僅允許紀錄進入調查，不代表其座標已獲認證。'],
  ['Official coordinate datum/positional accuracy not independently established', '尚未獨立確認官方座標基準與位置精度。'],
  ['No stable publisher facility identifier; composite uniqueness is snapshot-specific', '缺少發布者提供的穩定設施識別碼；組合鍵唯一性僅在該快照內成立。'],
  ['Facility operating status, public access and accessibility unknown', '設施營運狀態、對外開放與無障礙近用條件不明。'],
  ['Projected CRS unresolved', '投影座標參考系統尚未確認。'],
  ['ODS has repeated-cell structures; no production ODS converter accepted', 'ODS 含重複儲存格結構，尚未採用通過查核的正式轉換器。'],
  ['SHP/DBF/projected polygon ingestion is not implemented in v1; source administrative fields are not polygon verification', '第 1 版未實作 SHP／DBF 投影多邊形匯入；來源行政欄位不能取代多邊形驗證。'],
  ['No hotspot/facility identity', '缺少可對應的熱點或設施身分。'],
  ['No local demand denominator', '缺少在地需求分母。'],
  ['No operational quality time series', '缺少營運品質時間序列。'],
  ['Filename contains 1141218; this is not independently validated publication or retrieval evidence.', '檔名含 1141218，但這不是經獨立驗證的發布或取得日期證據。'],
];

export const policyTerms: Record<string, { zh: string; en: string }> = {
  acquired: { zh: '已取得', en: 'Acquired' },
  'retained-legacy': { zh: '保留舊版', en: 'Retained legacy edition' },
  day: { zh: '精確至日期', en: 'Day precision' },
  'inventory-evidence-review': { zh: '可供清冊證據審查', en: 'Eligible for inventory evidence review' },
  'reference-facility-contract-incomplete': { zh: '參考設施契約未完整建立', en: 'Reference-facility contract incomplete' },
  'excluded-projected-crs-unresolved': { zh: '已排除：投影座標參考系統未確認', en: 'Excluded: projected CRS unresolved' },
  'retained-offline-boundary-reference': { zh: '保留為離線區界參考', en: 'Retained offline boundary reference' },
  'citywide-context-only': { zh: '僅供全市背景參考', en: 'Citywide context only' },
  'ambiguous-source-identity': { zh: '來源身分有歧義', en: 'Ambiguous source identity' },
  'invalid-wgs84-coordinate': { zh: '無效的 WGS84 座標', en: 'Invalid WGS84 coordinates' },
  'no-current-counterpart': { zh: '缺少目前版對應紀錄', en: 'No current counterpart' },
  'changed-coordinates': { zh: '座標數值改變', en: 'Changed coordinates' },
  'new-source-relationship': { zh: '新增來源對應關係', en: 'New source relationship' },
  'ambiguous-legacy-relationship': { zh: '舊版對應關係有歧義', en: 'Ambiguous legacy relationship' },
  'duplicate-site-id': { zh: '重複地點識別碼', en: 'Duplicate site ID' },
  'duplicate-hotspot-id': { zh: '重複熱點識別碼', en: 'Duplicate hotspot ID' },
  'outside-or-unresolved-source-scope': { zh: '來源範圍為市外或尚未確認', en: 'Outside or unresolved source scope' },
  'missing-attribution': { zh: '缺少機關或業者資訊', en: 'Missing agency or vendor attribution' },
  'missing-documentation': { zh: '缺少文件欄位', en: 'Missing documentation' },
  'changed-category': { zh: '分類改變', en: 'Changed category' },
  'source-metadata-changed': { zh: '來源文件欄位改變', en: 'Changed source metadata' },
  'boundary-and-operation-unverified': { zh: '區界與營運狀態未驗證', en: 'Boundary and operation unverified' },
  'district-filter': { zh: '不符合行政區篩選', en: 'District filter mismatch' },
  'category-filter': { zh: '不符合分類篩選', en: 'Category filter mismatch' },
  'stale-source': { zh: '未納入保留舊版紀錄', en: 'Legacy-only records excluded' },
  'ambiguous-identity': { zh: '身分有歧義', en: 'Ambiguous identity' },
  'unverified-taipei-scope': { zh: '未確認來源標示為臺北範圍', en: 'Published Taipei scope unverified' },
};

const sourcePairs: Array<[string, string]> = [
  ['臺北市政府資訊局', 'Department of Information Technology, Taipei City Government'],
  ['臺北市政府教育局', 'Department of Education, Taipei City Government'],
  ['臺北市政府民政局', 'Department of Civil Affairs, Taipei City Government'],
  ['臺北市政府體育局', 'Department of Sports, Taipei City Government'],
  ['臺北市政府主計處', 'Department of Budget, Accounting and Statistics, Taipei City Government'],
  ['Government Data Open License, Version 1.0 (catalogue: 公開)', 'Government Data Open License, Version 1.0 (catalogue: public)'],
];

export function hasPolicyTextTranslation(value: string): boolean {
  return textPairs.some(([en]) => en === value) || sourcePairs.some(([original]) => original === value) || Object.hasOwn(policyTerms, value);
}

export function localizePolicyText(value: string, language: Language): string {
  const term = Object.hasOwn(policyTerms, value) ? policyTerms[value] : undefined;
  if (term) return term[language];
  const text = textPairs.find(([en]) => en === value);
  if (text) return language === 'zh' ? text[1] : text[0];
  const source = sourcePairs.find(([original]) => original === value);
  if (source) {
    if (value.startsWith('Government Data Open License')) return language === 'zh' ? '政府資料開放授權條款第 1 版（目錄標示：公開）' : source[1];
    return language === 'zh' ? source[0] : source[1];
  }
  return value; // Unknown publisher wording remains attributable, rather than guessed.
}

export function policyCandidateLabel(candidate: PolicyCandidate, field: 'name' | 'district' | 'category', language: Language): string {
  const english = { name: candidate.nameEn, district: candidate.districtEn, category: candidate.categoryEn };
  return language === 'en' ? english[field] || candidate[field] : candidate[field];
}
