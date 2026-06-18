import type { Language, WifiHotspot, WifiSummary } from '../types';
import type { Translation } from '../translations';

function BarChart({
  title,
  values,
}: {
  title: string;
  values: Array<{ label: string; count: number }>;
}) {
  const max = Math.max(...values.map((value) => value.count), 1);
  return (
    <article className="chart-card">
      <h3>{title}</h3>
      <div className="bar-chart">
        {values.slice(0, 12).map((value) => (
          <div className="bar-row" key={value.label}>
            <span title={value.label}>{value.label}</span>
            <div><i style={{ width: `${(value.count / max) * 100}%` }} /></div>
            <b>{value.count.toLocaleString()}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

export function DataOverviewDashboard({
  summary,
  hotspots,
  language,
  copy,
}: {
  summary: WifiSummary;
  hotspots: WifiHotspot[];
  language: Language;
  copy: Translation;
}) {
  const labels = {
    area: new Map(hotspots.map((item) => [item.areaZh, language === 'en' ? item.areaEn || item.areaZh : item.areaZh])),
    type: new Map(hotspots.map((item) => [item.hotspotTypeZh, language === 'en' ? item.hotspotTypeEn || item.hotspotTypeZh : item.hotspotTypeZh])),
    agency: new Map(hotspots.filter((item) => item.agencyZh).map((item) => [item.agencyZh!, language === 'en' ? item.agencyEn || item.agencyZh! : item.agencyZh!])),
  };
  const cards = [
    [copy.totalHotspots, summary.total],
    [copy.taipeiCityHotspots, summary.taipeiCityCount],
    [copy.outsideTaipeiRecords, summary.outsideTaipeiCount],
    [copy.hotspotTypes, summary.byType.length],
    [copy.areasCovered, summary.byArea.length],
    [copy.topArea, labels.area.get(summary.byArea[0]?.area ?? '') ?? '—'],
    [copy.topHotspotType, labels.type.get(summary.byType[0]?.hotspotType ?? '') ?? '—'],
    [copy.topAgency, labels.agency.get(summary.byAgency[0]?.agency ?? '') ?? '—'],
  ];
  const topAreas = summary.byArea.slice(0, 10).map(({ area }) => area);
  const topCategories = summary.byCategory.slice(0, 6);
  const matrix = topAreas.map((area) => ({
    area,
    values: topCategories.map(({ category }) =>
      hotspots.filter((item) => item.areaZh === area && item.hotspotCategory === category).length,
    ),
  }));

  return (
    <section className="content-section">
      <div className="section-heading">
        <div><span className="section-number">04</span><h2>{copy.dataOverview}</h2></div>
        <p>{copy.coverageNote}</p>
      </div>
      <div className="summary-grid">
        {cards.map(([label, value]) => (
          <article key={label}><span>{label}</span><strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong></article>
        ))}
      </div>
      <div className="chart-grid">
        <BarChart title={copy.hotspotsByArea} values={summary.byArea.map(({ area, count }) => ({ label: labels.area.get(area) || area, count }))} />
        <BarChart title={copy.hotspotsByType} values={summary.byType.map(({ hotspotType, count }) => ({ label: labels.type.get(hotspotType) || hotspotType, count }))} />
        <BarChart title={copy.hotspotsByAgency} values={summary.byAgency.map(({ agency, count }) => ({ label: labels.agency.get(agency) || agency, count }))} />
        <article className="chart-card">
          <h3>{copy.taipeiVsOutside}</h3>
          <div className="donut-wrap">
            <div className="donut" style={{ '--taipei-share': `${summary.total ? (summary.taipeiCityCount / summary.total) * 360 : 0}deg` } as React.CSSProperties}>
              <span>{summary.total.toLocaleString()}</span>
            </div>
            <ul><li><i className="taipei-dot" />{copy.taipeiCityHotspots}: {summary.taipeiCityCount.toLocaleString()}</li><li><i className="outside-dot" />{copy.outsideTaipeiRecords}: {summary.outsideTaipeiCount.toLocaleString()}</li></ul>
          </div>
        </article>
        <article className="chart-card matrix-card">
          <h3>{copy.hotspotCategoriesByDistrict}</h3>
          <div className="matrix">
            {matrix.map((row) => (
              <div key={row.area}><b>{labels.area.get(row.area) || row.area}</b>{row.values.map((value, index) => <span key={topCategories[index]?.category} title={`${topCategories[index]?.category}: ${value}`} style={{ opacity: value ? Math.min(.2 + value / 80, 1) : .05 }}>{value || ''}</span>)}</div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
