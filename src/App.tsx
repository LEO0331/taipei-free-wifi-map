import { useMemo, useState, useEffect } from 'react';
import type { ConversionReport, Filters, Language, WifiHotspot, WifiSummary } from './types';
import { translations } from './translations';
import { buildWifiSummary, filterWifiHotspots } from './lib/wifi';
import { getNearbyHotspots } from './lib/view';
import { DataNotes } from './components/DataNotes';
import { DataOverviewDashboard } from './components/Dashboard';
import { HotspotDirectory, NearbyWifiHotspots } from './components/Hotspots';
import { DisclaimerNotice, FilterPanel, Footer, LanguageToggle, MainTabs, type Tab } from './components/Layout';
import { WifiMap } from './components/WifiMap';

const defaultFilters: Filters = {
  search: '',
  area: '',
  hotspotType: '',
  agency: '',
  vendor: '',
  taipeiCityOnly: true,
};

export default function App() {
  const [language, setLanguage] = useState<Language>('zh');
  const [active, setActive] = useState<Tab>('map');
  const [filters, setFilters] = useState(defaultFilters);
  const [hotspots, setHotspots] = useState<WifiHotspot[]>([]);
  const [sourceSummary, setSourceSummary] = useState<WifiSummary | null>(null);
  const [, setReport] = useState<ConversionReport | null>(null);
  const [loadingError, setLoadingError] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>();
  const [locationError, setLocationError] = useState('');
  const [radius, setRadius] = useState(500);
  const copy = translations[language];

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/wifi-hotspots.json`).then((response) => {
        if (!response.ok) throw new Error('hotspots');
        return response.json() as Promise<WifiHotspot[]>;
      }),
      fetch(`${base}data/wifi-summary.json`).then((response) => response.json() as Promise<WifiSummary>),
      fetch(`${base}data/conversion-report.json`).then((response) => response.json() as Promise<ConversionReport>),
    ])
      .then(([records, summary, conversionReport]) => {
        setHotspots(records);
        setSourceSummary(summary);
        setReport(conversionReport);
      })
      .catch(() => setLoadingError(true));
  }, []);

  const filtered = useMemo(() => filterWifiHotspots(hotspots, filters), [hotspots, filters]);
  const filtersActive = filters.search || filters.area || filters.hotspotType || filters.agency || filters.vendor || !filters.taipeiCityOnly;
  const summary = useMemo(
    () => filtersActive || !sourceSummary ? buildWifiSummary(filtered) : sourceSummary,
    [filtered, filtersActive, sourceSummary],
  );
  const options = useMemo(() => {
    const unique = (values: Array<string | undefined>) => [...new Set(values.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    return {
      areas: unique(hotspots.map((item) => item.areaZh)),
      types: unique(hotspots.map((item) => item.hotspotTypeZh)),
      agencies: unique(hotspots.map((item) => item.agencyZh)),
      vendors: unique(hotspots.map((item) => item.vendorId)),
    };
  }, [hotspots]);
  const nearby = useMemo(
    () => userLocation ? getNearbyHotspots(filtered, userLocation, radius) : [],
    [filtered, radius, userLocation],
  );

  const locate = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError(copy.unableToGetLocation);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setLocationError(copy.unableToGetLocation),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <>
      <header className="site-header">
        <div className="brand-mark" aria-hidden="true"><span>Wi</span><b>Fi</b></div>
        <div className="brand-copy"><span>TAIPEI PUBLIC NETWORK INDEX</span><h1>{copy.appTitle}</h1><p>{copy.appSubtitle}</p></div>
        <LanguageToggle language={language} onChange={setLanguage} copy={copy} />
      </header>
      <main>
        <MainTabs active={active} onChange={setActive} copy={copy} />
        <FilterPanel filters={filters} onChange={setFilters} options={options} copy={copy} />
        <DisclaimerNotice copy={copy} />
        {loadingError ? <p className="error-message">{copy.loadError}</p> : hotspots.length === 0 ? <p className="loading">{copy.loading}</p> : (
          <>
            {active === 'map' && (
              <section className="map-section">
                <div className="section-heading map-heading">
                  <div><span className="section-number">01</span><h2>{copy.wifiMap}</h2></div>
                  <p>{copy.mapResultCount}: <strong>{filtered.filter((item) => item.coordinateStatus === 'valid').length.toLocaleString()}</strong></p>
                </div>
                <WifiMap hotspots={filtered} language={language} copy={copy} userLocation={userLocation} />
              </section>
            )}
            {active === 'nearby' && (
              <>
                <div className="nearby-map"><WifiMap hotspots={nearby.map((item) => item.hotspot)} language={language} copy={copy} userLocation={userLocation} /></div>
                <NearbyWifiHotspots nearby={nearby} language={language} copy={copy} radius={radius} onRadiusChange={setRadius} onLocate={locate} error={locationError} hasLocation={Boolean(userLocation)} />
              </>
            )}
            {active === 'directory' && <HotspotDirectory hotspots={filtered} language={language} copy={copy} />}
            {active === 'overview' && <DataOverviewDashboard summary={summary} hotspots={filtered} copy={copy} />}
            {active === 'notes' && <DataNotes copy={copy} />}
          </>
        )}
      </main>
      <Footer copy={copy} />
    </>
  );
}
