import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import type { Language } from '../types';
import type { Facility, GeographicManifest, GeographicSettings, GeographicSnapshot } from '../types/wifiGeographicPolicy';
import { checkedGeographicJson, geographicCsv, geographicExport, validateGeographicManifest, validateGeographicSnapshot } from '../lib/wifiGeographicPolicy';
import { compareGeographicScenarios, defaultGeographicSettings, runGeographicScenario } from '../lib/wifiGeographicScenarios';
import './WifiGeographicDashboard.css';

const copy = {
  zh: {
    title:'模式 B · 公共設施現勘規劃', intro:'距離與名單情境探索',
    takeaway:'這個情境告訴你什麼？', nextStep:'現勘前先確認',
    nextStepNote:'核對設施是否仍開放、位置是否正確、是否允許現勘；到場後再驗證連線與使用條件。距離較遠不等於需求較高，距離較近也不等於可以連線。',
    noVerified:'選擇「僅官方 CRS 已驗證」時，目前沒有合格設施。這表示座標證據尚不足，不代表沒有公共設施或沒有 Wi-Fi。可切換「已驗證＋假設測試」探索假設情境。',
    warning:'這是設施紀錄的幾何研究；不代表 Wi-Fi 訊號、連線、居民服務、數位近用、設置適宜性或設備設置授權。原始座標準確度與現行營運仍未知。',
    loading:'載入獨立地理研究產物…',error:'地理產物載入或完整性驗證失敗。',retry:'重試',
    evidence:'座標證據門檻',verified:'僅官方 CRS 已驗證',assumed:'已驗證＋假設測試',radius:'幾何距離參數',radiusNote:'100／250／500 公尺是分析參數，不是 Wi-Fi 訊號半徑。',
    geography:'多邊形資格',strict:'嚴格內部（距邊界 > 10 公尺）',flagged:'內部＋標示邊界鄰近不確定性',cohort:'設施母體',all:'合併設施',B:'圖書館',C:'活動中心',D:'運動中心',
    strategy:'研究策略',marginal:'邊際參照近鄰',representation:'行政區／設施類別輪替',capacity:'實地查核名額',allSlots:'全部符合資格',
    eligible:'符合情境的設施紀錄',used:'名單筆數',excluded:'排除紀錄',baseline:'距離內有公布熱點的設施紀錄',increment:'假設加入候選後的新增近鄰紀錄',self:'其中：候選自身紀錄',additional:'其中：其他設施紀錄',
    trivial:'此情境沒有足以支持最佳化的新增其他設施近鄰差異。名單供現勘查核；排序不代表增設效益或投資優先順序。',
    selfNote:'候選與參照使用相同母體。自身零距離貢獻分開列示，不能視為投資效益；新增數量只計尚未近鄰的不同設施紀錄。輪替表示行政區／設施類別多樣性，不代表人口公平。',
    geometry:'官方歷史邊界與座標證據',geometryNote:'2024-09-16 邊界版本，不證明現行行政界。轉換操作約 1 公尺精度不等於原始位置精度。10／25／50 公尺邊界敏感度是假設參數。原始細小重疊完整揭露，沒有靜默修補。',
    polygons:'通過幾何檢查的行政區',tiers:'設施證據層級：已驗證／假設測試／未解決',hotspots:'可用發布熱點列／原始列',disagreements:'熱點／設施行政區不一致',
    map:'調查候選地圖',boundaries:'顯示歷史官方邊界',circles:'顯示假設性幾何研究半徑',mapNote:'最多顯示 91 筆候選；點選標記或表格可檢視同一筆來源。半徑圓不代表無線電涵蓋。',
    shortlist:'實際來源衍生名單',name:'來源設施（原文）',district:'來源／多邊形行政區',distance:'最近合格發布熱點距離',contribution:'自身／其他／合計新增',detail:'來源與證據詳情',
    original:'原始座標',transformed:'轉換座標',assumption:'假設 CRS',status:'空間檢查',boundary:'距最近界線',tier:'證據層級',row:'來源列',unknown:'未知／未建立',
    empty:'此設定沒有符合資格的候選。已驗證母體為空是有效研究結果。',selection:'選取原因',
    sensitivity:'敏感度比較（相對目前名單）',setting:'替代情境',added:'新增 ID',removed:'移除 ID',shared:'共同 ID',denominator:'分母差',delta:'基線／新增差',representationChange:'行政區／類別變動',
    sensitivityNote:'不同母體不代表相等需求。結果依賴未確認 CRS；名單穩定也不能確立政策優先順序。所有差異 ID 可展開查核。',
    exclusions:'未解決與排除的設施',excludedBy:'排除條件',exports:'匯出目前研究紀錄',exportNote:'含有序 ID、來源列與雜湊、原始座標、假設、分母、排除原因及不可用指標。不是設備設置建議。',
    source:'官方來源',audit:'完整座標稽核',hotspotAudit:'熱點空間稽核',identity:'身分與重疊診斷',identityNote:'研究單位為「同版來源名稱＋地址複合鍵」，不是已驗證獨立實體場址或跨版永久身分。不自動跨來源合併。',
    fallback:'來源未提供官方英文設施名稱／地址，兩種語言均保留原文供追溯。',
  },
  en: {
    title:'Mode B · Facility fieldwork planning',intro:'Distance and shortlist exploration',
    takeaway:'What does this scenario tell you?',nextStep:'Before a site visit',
    nextStepNote:'Confirm that the facility is still open, its location is correct and a visit is permitted. Verify connectivity and access conditions on site. Greater distance does not establish greater demand; proximity does not establish connectivity.',
    noVerified:'The publisher-verified CRS setting currently has no eligible facilities. This means coordinate evidence is insufficient, not that facilities or Wi-Fi are absent. Choose verified + assumption-tested to explore hypothetical scenarios.',
    warning:'Geometric research on facility records only. This does not establish Wi-Fi signal, connectivity, resident service, digital inclusion, installation suitability or authorization. Original positional accuracy and current operation remain unknown.',
    loading:'Loading the independent geographic research artifacts…',error:'Geographic artifacts failed loading or integrity validation.',retry:'Retry',
    evidence:'Coordinate evidence threshold',verified:'Publisher CRS verified only',assumed:'Verified + assumption-tested',radius:'Geometric distance parameter',radiusNote:'100 / 250 / 500 metres are analytical parameters, not Wi-Fi signal radii.',
    geography:'Polygon eligibility',strict:'Strict interior (> 10 m from boundary)',flagged:'Interior + flagged boundary-adjacent uncertainty',cohort:'Facility population',all:'Combined facilities',B:'Libraries',C:'Activity centers',D:'Sports centers',
    strategy:'Research strategy',marginal:'Marginal Reference Proximity',representation:'District / facility-category round-robin',capacity:'Field-review slots',allSlots:'All eligible',
    eligible:'Eligible facility records',used:'Shortlisted records',excluded:'Excluded records',baseline:'Facility records near a published hotspot',increment:'Newly proximate records after hypothetical additions',self:'Of these: candidate itself',additional:'Of these: other facility records',
    trivial:'No incremental differences for other facility records support optimization in this scenario. Use the shortlist for field verification; its order establishes neither installation benefit nor investment priority.',
    selfNote:'Candidates and references use the same population. Own-reference zero-distance counts are separated and cannot establish investment benefit. Increments count distinct records not already proximate. Round-robin represents district / facility diversity, not demographic equity.',
    geometry:'Official historical boundaries and coordinate evidence',geometryNote:'Boundary edition 2024-09-16 does not establish current administrative boundaries. The operation’s approximate 1 m accuracy does not establish original positional accuracy. Boundary tolerances 10 / 25 / 50 m are research parameters. Tiny original overlaps are disclosed without silent repair.',
    polygons:'Districts passing geometry checks',tiers:'Facility tiers: verified / assumption-tested / unresolved',hotspots:'Eligible published hotspot rows / original rows',disagreements:'Hotspot / facility district disagreements',
    map:'Investigation candidate map',boundaries:'Show historical official boundaries',circles:'Show hypothetical geometric research radius',mapNote:'At most 91 candidate markers. Select a marker or table row to inspect its source record. Circles do not represent radio coverage.',
    shortlist:'Actual source-derived shortlist',name:'Source facility (original wording)',district:'Source / polygon district',distance:'Nearest eligible published hotspot',contribution:'Own / other / total new references',detail:'Source and evidence details',
    original:'Original coordinates',transformed:'Transformed coordinates',assumption:'Assumed CRS',status:'Spatial check',boundary:'Nearest boundary distance',tier:'Coordinate evidence',row:'Source row',unknown:'Unknown / not established',
    empty:'No candidates qualify. An empty verified-only population is a valid research result.',selection:'Selection reason',
    sensitivity:'Sensitivity comparison (relative to current shortlist)',setting:'Alternate scenario',added:'Added IDs',removed:'Removed IDs',shared:'Shared IDs',denominator:'Denominator change',delta:'Baseline / increment change',representationChange:'District / category changes',
    sensitivityNote:'Different cohorts do not represent equal demand. Results depend on unconfirmed CRS; stable membership cannot establish policy priorities. Expand to inspect every differing ID.',
    exclusions:'Unresolved and excluded facilities',excludedBy:'Exclusion conditions',exports:'Export the current research record',exportNote:'Includes ordered IDs, source rows and hashes, original coordinates, assumptions, denominators, exclusions and unavailable metrics. This is not an installation recommendation.',
    source:'Official source',audit:'Complete coordinate audit',hotspotAudit:'Hotspot spatial audit',identity:'Identity and overlap diagnostics',identityNote:'The research unit is a within-edition name/address composite, not a verified distinct physical site or longitudinal identity. No automatic cross-source merging.',
    fallback:'No official English facility names / addresses are supplied; original source wording is retained in both languages for traceability.',
  },
};
const codes: Record<string,[string,string]> = {
  verified:['已驗證','Verified'],'assumption-tested':['假設測試','Assumption-tested'],unresolved:['未解決','Unresolved'],
  interior:['多邊形內部','Polygon interior'],'boundary-adjacent':['邊界鄰近','Boundary-adjacent'],exterior:['多邊形外部','Polygon exterior'],ambiguous:['歧義／多重匹配','Ambiguous / multiple matches'],invalid:['無效座標','Invalid coordinate'],
  'district-discrepancy':['行政區不一致或來源未明示','District discrepancy or missing source label'],'invalid-coordinate':['無效座標','Invalid coordinate'],'unresolved-geography':['地理歸屬未解決','Unresolved geography'],'missing-identity':['缺少名稱／地址','Missing name / address'],'duplicate-composite':['重複複合身分','Duplicate composite'],
  'requires-verified':['要求官方 CRS 證據','Publisher CRS evidence required'],'other-cohort':['其他設施母體','Other facility cohort'],'strict-interior-required':['要求嚴格多邊形內部','Strict polygon interior required'],
  marginal:['重算尚未近鄰參照的邊際數，再以 ID 決定同分順序','Recomputed uncounted reference marginal, then ID tie-break'],representation:['優先尚未代表的行政區／類別組，再比邊際數與 ID','Least represented district/category group, then marginal and ID'], 'descriptive-only':['無非自身差異；依 ID 描述性排序','No non-self differences; descriptive ID order'],
};
const districtEn: Record<string,string> = {'北投區':'Beitou','士林區':'Shilin','內湖區':'Neihu','南港區':'Nangang','松山區':'Songshan','信義區':'Xinyi','中山區':'Zhongshan','大同區':'Datong','中正區':'Zhongzheng','萬華區':'Wanhua','大安區':'Daan','文山區':'Wenshan'};
const root = `${import.meta.env.BASE_URL}data/wifi-policy/geographic-v1.1/`;

function ResearchMap({facilities, geometry, radius, circles, language, onSelect}:{facilities:Facility[];geometry?:GeoJsonObject;radius:number;circles:boolean;language:Language;onSelect:(id:string)=>void}) {
  const container = useRef<HTMLDivElement>(null);
  const view = useRef<{center:L.LatLng;zoom:number}>(null);
  useEffect(()=>{
    if (!container.current) return;
    const map=L.map(container.current,{scrollWheelZoom:false}).setView(view.current?.center??[25.065,121.54],view.current?.zoom??11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);
    if (geometry) L.geoJSON(geometry,{style:{color:'#617866',weight:1,fillOpacity:0.025}}).addTo(map);
    for (const f of facilities.slice(0,91)) if (f.latitude!==null && f.longitude!==null) {
      const label=document.createElement('span');label.textContent=f.name+(circles?' · '+(language==='zh'?'假設性幾何研究半徑':'Hypothetical geometric research radius'):'');
      L.circleMarker([f.latitude,f.longitude],{radius:7,color:'#9b4b24',fillColor:'#d68a4b',fillOpacity:0.9}).bindTooltip(label).on('click',()=>onSelect(f.id)).addTo(map);
      if (circles) L.circle([f.latitude,f.longitude],{radius,color:'#9b4b24',weight:1,fillOpacity:0.07,interactive:false}).addTo(map);
    }
    return ()=>{view.current={center:map.getCenter(),zoom:map.getZoom()};map.remove();};
  },[facilities,geometry,radius,circles,language,onSelect]);
  return <div ref={container} className="geographic-map" aria-label={copy[language].map} />;
}

export default function WifiGeographicDashboard({language}:{language:Language}) {
  const t=copy[language], local=(key:string)=>codes[key]?.[language==='zh'?0:1]??key;
  const district=(name:string|null)=>name ? language==='en'?districtEn[name]??name:name : t.unknown;
  const [data,setData]=useState<{manifest:GeographicManifest;snapshot:GeographicSnapshot}>();
  const [error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  const [settings,setSettings]=useState<GeographicSettings>(defaultGeographicSettings);
  const [geometry,setGeometry]=useState<GeoJsonObject>(),[showBoundary,setShowBoundary]=useState(false),[circles,setCircles]=useState(false);
  const [boundaryError,setBoundaryError]=useState(false),[boundaryAttempt,setBoundaryAttempt]=useState(0);
  const [focus,setFocus]=useState('');
  useEffect(()=>{
    const controller=new AbortController();setError(false);
    (async()=>{
      const response=await fetch(root+'manifest.json',{signal:controller.signal,cache:'no-cache'});
      if (!response.ok) throw new Error('manifest');
      const manifest:unknown=await response.json();validateGeographicManifest(manifest);
      const descriptor=manifest.artifacts['snapshot.json'];
      const snapshot=await checkedGeographicJson(await fetch(root+descriptor.path,{signal:controller.signal}),descriptor);
      validateGeographicSnapshot(snapshot);if(snapshot.versionId!==manifest.versionId)throw new Error('version');if(!controller.signal.aborted)setData({manifest,snapshot});
    })().catch(()=>{if(!controller.signal.aborted)setError(true);});
    return ()=>controller.abort();
  },[attempt]);
  useEffect(()=>{
    if(!showBoundary || geometry || !data)return;
    setBoundaryError(false);
    const controller=new AbortController();
    const d=data.manifest.artifacts['boundaries.geojson'];
    fetch(root+d.path,{signal:controller.signal}).then(r=>checkedGeographicJson(r,d)).then(value=>{if(!controller.signal.aborted)setGeometry(value as GeoJsonObject);}).catch(()=>{if(!controller.signal.aborted)setBoundaryError(true);});
    return ()=>controller.abort();
  },[showBoundary,geometry,data,boundaryAttempt]);
  const scenario=useMemo(()=>data?runGeographicScenario(data.snapshot,data.manifest.versionId,settings):undefined,[data,settings]);
  const selected=useMemo(()=>data&&scenario?scenario.selectedIds.map(id=>data.snapshot.facilities.find(f=>f.id===id)!):[],[data,scenario]);
  const alternatives=useMemo(()=>{
    if(!data||!scenario)return [];
    const variants: {label:string;settings:GeographicSettings}[]=[
      ...([5,10,'all'] as const).map(capacity=>({label:`${t.capacity}: ${capacity==='all'?t.allSlots:capacity}`,settings:{...settings,capacity}})),
      ...(['marginal','representation'] as const).map(strategy=>({label:t[strategy],settings:{...settings,strategy}})),
      ...(['verified','assumed'] as const).map(evidence=>({label:t[evidence],settings:{...settings,evidence}})),
      ...([100,250,500] as const).map(radius=>({label:`${radius} m`,settings:{...settings,radius}})),
      ...(['strict','flagged'] as const).map(geography=>({label:t[geography],settings:{...settings,geography}})),
      ...(['all','B','C','D'] as const).map(cohort=>({label:t[cohort],settings:{...settings,cohort}})),
    ];
    return variants.map(v=>{const result=runGeographicScenario(data.snapshot,data.manifest.versionId,v.settings);return {...v,result,diff:compareGeographicScenarios(scenario,result)};});
  },[data,scenario,settings,t]);
  const update=(change:Partial<GeographicSettings>)=>setSettings({...settings,...change});
  const download=(format:'json'|'csv')=>{
    if(!data||!scenario)return;
    const body=format==='json'?JSON.stringify(geographicExport(data.snapshot,data.manifest,scenario),null,2):geographicCsv(data.snapshot,data.manifest,scenario);
    const url=URL.createObjectURL(new Blob([body],{type:format==='json'?'application/json;charset=utf-8':'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`${data.manifest.versionId}-${settings.strategy}-${settings.radius}.${format}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  if(error)return <section className="policy-card"><p role="alert">{t.error}</p><button onClick={()=>{setShowBoundary(false);setAttempt(attempt+1);}}>{t.retry}</button></section>;
  if(!data||!scenario)return <p role="status">{t.loading}</p>;
  const {snapshot,manifest}=data,summary=snapshot.summary;
  const focused=snapshot.facilities.find(f=>f.id===focus);
  return <div className="geographic-dashboard">
    <section className="policy-card geographic-intro"><span className="eyebrow">Policy #8 v1.1 · {t.intro}</span><h3>{t.title}</h3><p>{t.warning}</p><code>{manifest.versionId}</code></section>
    <section className="policy-card"><h3>{t.geometry}</h3><p>{t.geometryNote}</p><dl className="geographic-metrics">
      <dt>{t.polygons}</dt><dd>{summary.districts.length}</dd><dt>{t.tiers}</dt><dd>{summary.facilities.tiers.verified??0} / {summary.facilities.tiers['assumption-tested']??0} / {summary.facilities.tiers.unresolved??0}</dd>
      <dt>{t.hotspots}</dt><dd>{summary.hotspots.eligible} / {summary.hotspots.rows}</dd><dt>{t.disagreements}</dt><dd>{summary.hotspots.districtDisagreements} / {summary.facilities.districtDisagreements}</dd>
    </dl><p>EPSG:3826 → EPSG:4326 · PROJ · {snapshot.geometryEdition}</p><p>{t.identityNote}</p><details><summary>{t.identity}</summary><pre>{JSON.stringify({identity:summary.facilities.identity,overlaps:summary.overlaps,repairs:summary.repairs},null,2)}</pre></details></section>
    <section className="policy-card"><div className="policy-controls">
      <label>{t.evidence}<select value={settings.evidence} onChange={e=>update({evidence:e.target.value as GeographicSettings['evidence']})}><option value="verified">{t.verified}</option><option value="assumed">{t.assumed}</option></select></label>
      <label>{t.radius}<select value={settings.radius} onChange={e=>update({radius:Number(e.target.value) as GeographicSettings['radius']})}>{[100,250,500].map(r=><option key={r} value={r}>{r} m</option>)}</select></label>
      <label>{t.geography}<select value={settings.geography} onChange={e=>update({geography:e.target.value as GeographicSettings['geography']})}><option value="strict">{t.strict}</option><option value="flagged">{t.flagged}</option></select></label>
      <label>{t.cohort}<select value={settings.cohort} onChange={e=>update({cohort:e.target.value as GeographicSettings['cohort']})}>{(['all','B','C','D'] as const).map(c=><option key={c} value={c}>{t[c]}</option>)}</select></label>
      <label>{t.capacity}<select value={settings.capacity} onChange={e=>update({capacity:e.target.value==='all'?'all':Number(e.target.value) as 5|10})}><option value="5">5</option><option value="10">10</option><option value="all">{t.allSlots}</option></select></label>
      <label>{t.strategy}<select value={settings.strategy} onChange={e=>update({strategy:e.target.value as GeographicSettings['strategy']})}><option value="marginal">{t.marginal}</option><option value="representation">{t.representation}</option></select></label>
    </div><p>{t.radiusNote}</p></section>
    <div className="summary-grid policy-summary">{[[t.used,scenario.capacityUsed],[t.eligible,scenario.referenceDenominator],[t.excluded,scenario.excludedCount],[t.baseline,scenario.baselineProximate],[t.increment,scenario.newlyProximate],[t.self,scenario.ownContributions],[t.additional,scenario.additionalContributions]].map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <section className="policy-card"><h3>{t.takeaway}</h3>
      <p>{language === 'zh'
        ? `在目前假設與篩選下，${scenario.referenceDenominator} 筆設施紀錄中有 ${scenario.baselineProximate} 筆，在 ${settings.radius} 公尺直線距離內有已公布熱點；其餘 ${scenario.referenceDenominator - scenario.baselineProximate} 筆在此距離內未找到合格公布熱點。這不是訊號涵蓋或實際服務缺口。`
        : `Under the current assumptions and filters, ${scenario.baselineProximate} of ${scenario.referenceDenominator} facility records have an eligible published hotspot within ${settings.radius} metres in a straight line. The remaining ${scenario.referenceDenominator - scenario.baselineProximate} have no eligible published hotspot within that distance. This does not measure signal coverage or an actual service gap.`}</p>
      {settings.evidence === 'verified' && scenario.referenceDenominator === 0 && <p>{t.noVerified}</p>}
      <h4>{t.nextStep}</h4><p>{t.nextStepNote}</p>
    </section>
    <p>{t.selfNote}</p>{!scenario.optimizationAvailable&&<p className="geographic-notice" role="status">{t.trivial}</p>}
    <section className="policy-card"><h3>{t.map}</h3><div className="geographic-options"><label><input type="checkbox" checked={showBoundary} onChange={e=>setShowBoundary(e.target.checked)}/>{t.boundaries}</label><label><input type="checkbox" checked={circles} onChange={e=>setCircles(e.target.checked)}/>{t.circles}</label></div><p>{t.mapNote}</p>{boundaryError&&<p role="alert">{t.boundaries}: {t.error} <button onClick={()=>setBoundaryAttempt(boundaryAttempt+1)}>{t.retry}</button></p>}<ResearchMap facilities={selected} geometry={showBoundary?geometry:undefined} radius={settings.radius} circles={circles} language={language} onSelect={setFocus}/></section>
    <section className="policy-card"><h3>{t.shortlist}</h3><p>{t.fallback}</p>{!selected.length?<p>{t.empty}</p>:<div className="policy-table-scroll"><table><thead><tr><th>{t.name}</th><th>{t.district}</th><th>{t.distance}</th><th>{t.contribution}</th></tr></thead><tbody>{selected.map((f,i)=><tr key={f.id}><td><button className="geographic-facility" onClick={()=>setFocus(f.id)}>{f.name}</button><code>{f.id}</code><span>{t[f.source]} · {local(f.tier)}</span></td><td>{district(f.sourceDistrict)} / {district(f.spatial.district)}</td><td>{f.nearestHotspotMeters[settings.geography]?.toFixed(1)??t.unknown} m</td><td>{scenario.selected[i].ownReference} / {scenario.selected[i].additionalReferences} / {scenario.selected[i].marginalReferences}<p>{local(scenario.selected[i].reason)}</p></td></tr>)}</tbody></table></div>}</section>
    {focused&&<section className="policy-card" aria-live="polite"><h3>{t.detail} · {focused.name}</h3><p>{focused.address}</p><dl className="geographic-metrics"><dt>{t.row}</dt><dd>{focused.sourceFile} · {focused.sourceRow}</dd><dt>{t.tier}</dt><dd>{local(focused.tier)}</dd><dt>{t.original}</dt><dd>{JSON.stringify(focused.originalCoordinates)}</dd><dt>{t.assumption}</dt><dd>{focused.assumedCRS}</dd><dt>{t.transformed}</dt><dd>{focused.longitude}, {focused.latitude}</dd><dt>{t.status}</dt><dd>{local(focused.spatial.status)}</dd><dt>{t.boundary}</dt><dd>{focused.spatial.boundaryMeters?.toFixed(2)} m</dd></dl><code>{focused.sourceHash}</code><a href={focused.sourceUrl} target="_blank" rel="noreferrer">{t.source}</a><p>{t.warning}</p></section>}
    <section className="policy-card"><h3>{t.sensitivity}</h3><p>{t.sensitivityNote}</p><div className="policy-table-scroll"><table><thead><tr><th>{t.setting}</th><th>{t.added} / {t.removed} / {t.shared}</th><th>{t.denominator}</th><th>{t.delta}</th></tr></thead><tbody>{alternatives.map((a,i)=><tr key={i}><td>{a.label}</td><td><details><summary>{a.diff.added.length} / {a.diff.removed.length} / {a.diff.shared.length}</summary><pre>{JSON.stringify(a.diff,null,2)}</pre></details></td><td>{a.diff.denominatorChange}</td><td>{a.diff.baselineChange} / {a.diff.incrementChange}</td></tr>)}</tbody></table></div></section>
    <section className="policy-card"><h3>{t.exclusions}</h3><div className="policy-table-scroll"><table><thead><tr><th>{t.name}</th><th>{t.excludedBy}</th></tr></thead><tbody>{scenario.excluded.map(e=><tr key={e.id}><td><button className="geographic-facility" onClick={()=>setFocus(e.id)}>{snapshot.facilities.find(f=>f.id===e.id)?.name}</button><code>{e.id}</code></td><td>{e.reasons.map(local).join(' · ')}</td></tr>)}</tbody></table></div></section>
    <section className="policy-card"><h3>{t.exports}</h3><p>{t.exportNote}</p><div className="policy-actions"><button onClick={()=>download('json')}>JSON</button><button onClick={()=>download('csv')}>CSV</button></div><p><a href={root+manifest.artifacts['coordinate-audit.json'].path}>{t.audit}</a> · <a href={root+manifest.artifacts['hotspot-audit.json'].path}>{t.hotspotAudit}</a></p>{snapshot.sourceEditions.map(s=><p key={s.id}><a href={s.catalogueUrl} target="_blank" rel="noreferrer">{t.source} {s.id}</a> · {s.publishedAt}<code>{s.sha256}</code></p>)}</section>
  </div>;
}
