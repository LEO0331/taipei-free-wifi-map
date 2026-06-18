import type { Translation } from '../translations';

export function DataNotes({ copy }: { copy: Translation }) {
  return (
    <section className="content-section notes-section">
      <div className="section-heading">
        <div><span className="section-number">05</span><h2>{copy.dataNotes}</h2></div>
      </div>
      <div className="notes-grid">
        <article><span>01</span><h3>{copy.dataSource}</h3><p>臺北市公眾區免費無線上網熱點資料(新版)</p><a href="https://data.taipei/dataset/detail?id=6aa6532d-652f-4c1b-814a-4646b75407af" target="_blank" rel="noreferrer">data.taipei ↗</a></article>
        <article><span>02</span><h3>{copy.updateFrequency}</h3><p>{copy.everySixMonths}</p></article>
        <article><span>03</span><h3>{copy.coordinateHandling}</h3><p>{copy.coordinateNote}</p></article>
        <article><span>04</span><h3>{copy.outsideTaipeiRecords}</h3><p>{copy.outsideNote}</p></article>
      </div>
      <p className="large-disclaimer">{copy.availabilityDisclaimer}</p>
    </section>
  );
}
