import type { Language } from '../types';

export type PolicyMode = 'A' | 'B' | 'C';

const copy = {
  zh: {
    title: '從資料查核到現地驗證',
    intro: '依照要解決的問題選擇工具。三個模式可分別使用；A、B 的名單可作為 C 現地驗證的起點。',
    output: '你會得到', next: '下一步', boundary: '使用界線',
    modes: {
      A: { title: 'A · 熱點資料查核', status: '可使用', question: '哪些熱點紀錄應先查核？',
        output: '依版本差異、身分與文件缺漏，選取 5 筆、10 筆或全部查核紀錄，並匯出清單與來源依據。',
        next: '依每筆查核問題核對官方資料，必要時安排現地確認。',
        boundary: '這是資料查核順序。清單中的優先層級 A／B／C 表示問題類型與查核順序，與這裡的三個分析模式不同。' },
      B: { title: 'B · 公共設施現勘規劃', status: '實驗功能可使用', question: '哪些公共設施值得安排現地查核？',
        output: '檢視圖書館、活動中心與運動中心的候選地圖、到已公布熱點的直線距離，以及不同距離與名額設定下的名單；可匯出來源與假設。',
        next: '比較 100／250／500 公尺情境，檢查名單是否改變，再確認設施位置、開放狀態與現勘可行性。',
        boundary: '目前開放假設座標下的探索。座標轉換與歷史區界幾何已有檢查，原始設施座標仍待權威確認；距離不是訊號涵蓋或步行可達性，名單不是增設核准。' },
      C: { title: 'C · 服務與近用驗證', status: '驗證指引可用 · 成果待資料', question: '如何確認民眾實際用得到？',
        output: '現地驗證的工作步驟與證據需求，供規劃調查使用。目前尚無服務品質分數、受益人數或數位近用成果排名。',
        next: '從 A 或 B 匯出查核名單，交由調查人員與設施管理者確認，再依下方三步蒐集可比較的證據。',
        boundary: '公開熱點位置與設施距離無法證明連線可用、居民需求或數位排除。單次連線測試也不能代表長期服務品質。' },
    },
    plan: 'C · 現地驗證怎麼開始',
    planNote: '以下是建議調查流程，尚未在此系統蒐集或驗證成果資料。',
    steps: [
      ['確認站點與開放條件', '調查人員與設施管理者核對同一站點／設備識別碼、現地位置、開放時間、使用資格與無障礙條件，記錄查核日期。'],
      ['在可比較時段測試服務', '記錄日期、時段、測試位置、連線與登入是否成功、測試方法與失敗情況；以相同方法重複觀測。若取得使用量，需記錄統計範圍。'],
      ['確認需求與使用障礙', '以自願、去識別的訪談或調查了解設備、費用、操作及近用障礙；說明樣本、調查期間與目標人口，避免把連線次數當成受益人數。'],
    ],
    acceptance: '何時能評估成果？當站點可對應、觀測期間與方法可比較，且使用量與需求資料的計算對象已確認後，再定義指標與比較基準。需另行審查後才開放成果評估。',
  },
  en: {
    title: 'From record review to field verification',
    intro: 'Choose a tool for your question. Each mode can be used separately; A and B shortlists can inform field verification in C.',
    output: 'What you get', next: 'Next step', boundary: 'How to use the result',
    modes: {
      A: { title: 'A · Hotspot record review', status: 'Available', question: 'Which hotspot records need checking first?',
        output: 'Select 5, 10 or all records based on edition differences, identity issues and missing documentation. Export the shortlist with its source evidence.',
        next: 'Check official records against each review question and arrange site visits where needed.',
        boundary: 'This is a record-review order. Priority tiers A / B / C describe review issues and precedence; they are separate from these three analytical modes.' },
      B: { title: 'B · Facility fieldwork planning', status: 'Experimental tools available', question: 'Which public facilities warrant a site visit?',
        output: 'Inspect library, activity-center and sports-center candidates on a map, straight-line distances to published hotspots, and shortlists under different distance and capacity settings. Export sources and assumptions.',
        next: 'Compare 100 / 250 / 500 metre scenarios, check shortlist changes, then confirm facility locations, opening status and visit feasibility.',
        boundary: 'Exploration under coordinate assumptions is available. Coordinate transforms and historical boundary geometry have been checked; original facility coordinates still need authoritative confirmation. Distance establishes neither signal reach nor walking access. Shortlists are not installation approvals.' },
      C: { title: 'C · Service and access verification', status: 'Guidance available · outcomes await data', question: 'How can we check whether people can actually use the service?',
        output: 'Field-verification steps and evidence requirements for planning a survey. Service-quality scores, people served and digital-inclusion rankings are not available.',
        next: 'Export a review shortlist from A or B, confirm it with investigators and facility managers, then collect comparable evidence using the three steps below.',
        boundary: 'Published hotspot locations and facility distances do not establish connectivity, resident demand or digital exclusion. A single connection test cannot establish long-term quality.' },
    },
    plan: 'C · Start a field-verification plan',
    planNote: 'This is a suggested investigation workflow. Outcome data have not been collected or validated in this system.',
    steps: [
      ['Confirm the site and access conditions', 'Investigators and facility managers should match site / equipment identifiers, location, opening hours, eligibility and accessibility conditions. Record the verification date.'],
      ['Test service in comparable periods', 'Record date, time, test location, connection and login success, method and failures. Repeat observations with the same method. Document the scope of any usage statistics obtained.'],
      ['Check demand and barriers to use', 'Use voluntary, de-identified interviews or surveys to understand device, cost, skills and access barriers. State the sample, survey period and target population. Connection counts are not counts of people benefiting.'],
    ],
    acceptance: 'When can outcomes be assessed? First establish matching site identities, comparable observation periods and methods, and defined usage and demand populations. Then define indicators and a comparison baseline. Outcome assessment requires a separate review before release.',
  },
};

export default function WifiPolicyGuide({ language, mode, onSelect }: { language: Language; mode: PolicyMode; onSelect: (mode: PolicyMode) => void }) {
  const t = copy[language], selected = t.modes[mode];
  return <>
    <section className="policy-card" aria-labelledby="policy-guide-title">
      <h3 id="policy-guide-title">{t.title}</h3><p>{t.intro}</p>
      <div className="policy-mode-grid" role="group" aria-label={t.title}>
        {(['A', 'B', 'C'] as const).map(key => <button key={key} type="button" className="policy-mode-button" aria-pressed={mode === key} onClick={() => onSelect(key)}>
          <strong>{t.modes[key].title}</strong><span className="policy-mode-status">{t.modes[key].status}</span><span>{t.modes[key].question}</span>
        </button>)}
      </div>
      <h4>{selected.question}</h4>
      <dl className="policy-guide-details"><dt>{t.output}</dt><dd>{selected.output}</dd><dt>{t.next}</dt><dd>{selected.next}</dd><dt>{t.boundary}</dt><dd>{selected.boundary}</dd></dl>
    </section>
    {mode === 'C' && <section className="policy-card"><h3>{t.plan}</h3><p>{t.planNote}</p><ol className="policy-field-steps">{t.steps.map(([title, detail]) => <li key={title}><h4>{title}</h4><p>{detail}</p></li>)}</ol><p>{t.acceptance}</p></section>}
  </>;
}
