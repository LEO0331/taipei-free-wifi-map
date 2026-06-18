import type { Filters, Language } from '../types';
import type { Translation } from '../translations';

export type Tab = 'map' | 'nearby' | 'directory' | 'overview' | 'notes';

export function LanguageToggle({
  language,
  onChange,
  copy,
}: {
  language: Language;
  onChange: (language: Language) => void;
  copy: Translation;
}) {
  return (
    <button className="language-toggle" onClick={() => onChange(language === 'zh' ? 'en' : 'zh')}>
      <span aria-hidden="true">文</span> {copy.language}
    </button>
  );
}

export function MainTabs({
  active,
  onChange,
  copy,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  copy: Translation;
}) {
  const tabs: Array<[Tab, string]> = [
    ['map', copy.wifiMap],
    ['nearby', copy.nearbyHotspots],
    ['directory', copy.hotspotDirectory],
    ['overview', copy.dataOverview],
    ['notes', copy.dataNotes],
  ];
  return (
    <nav className="tabs" aria-label="Main sections">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          className={active === id ? 'active' : ''}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

export function FilterPanel({
  filters,
  onChange,
  options,
  copy,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  options: { areas: string[]; types: string[]; agencies: string[]; vendors: string[] };
  copy: Translation;
}) {
  const select = (key: keyof Filters, value: string | boolean) =>
    onChange({ ...filters, [key]: value });
  return (
    <section className="filters" aria-label="Hotspot filters">
      <label className="search-field">
        <span className="sr-only">{copy.searchPlaceholder}</span>
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={filters.search}
          placeholder={copy.searchPlaceholder}
          onChange={(event) => select('search', event.target.value)}
        />
      </label>
      <select aria-label={copy.area} value={filters.area} onChange={(event) => select('area', event.target.value)}>
        <option value="">{copy.allAreas}</option>
        {options.areas.map((value) => <option key={value}>{value}</option>)}
      </select>
      <select aria-label={copy.hotspotType} value={filters.hotspotType} onChange={(event) => select('hotspotType', event.target.value)}>
        <option value="">{copy.allTypes}</option>
        {options.types.map((value) => <option key={value}>{value}</option>)}
      </select>
      <select aria-label={copy.agency} value={filters.agency} onChange={(event) => select('agency', event.target.value)}>
        <option value="">{copy.allAgencies}</option>
        {options.agencies.map((value) => <option key={value}>{value}</option>)}
      </select>
      <select aria-label={copy.vendor} value={filters.vendor} onChange={(event) => select('vendor', event.target.value)}>
        <option value="">{copy.allVendors}</option>
        {options.vendors.map((value) => <option key={value}>{value}</option>)}
      </select>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={filters.taipeiCityOnly}
          onChange={(event) => select('taipeiCityOnly', event.target.checked)}
        />
        {copy.taipeiCityOnly}
      </label>
    </section>
  );
}

export function DisclaimerNotice({ copy }: { copy: Translation }) {
  return <aside className="disclaimer"><span aria-hidden="true">ⓘ</span>{copy.availabilityDisclaimer}</aside>;
}

export function Footer({ copy }: { copy: Translation }) {
  return <footer>{copy.footer}</footer>;
}
