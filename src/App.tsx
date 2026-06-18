import { useMemo, useState, useEffect } from 'react';
import type { Filters, Language, WifiHotspot } from './types';
import { translations } from './translations';
import { buildWifiSummary, filterWifiHotspots, hasValidCoordinates } from './lib/wifi';
import { buildFilterOptions, getNearbyHotspots } from './lib/view';
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
  const [loadingError, setLoadingError] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>();
  const [locationError, setLocationError] = useState(false);
  const [radius, setRadius] = useState(500);
  const copy = translations[language];

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/wifi-hotspots.json`)
      .then((response) => {
        if (!response.ok) throw new Error('hotspots');
        return response.json() as Promise<WifiHotspot[]>;
      })
      .then(setHotspots)
      .catch(() => setLoadingError(true));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    document.title = copy.appTitle;
  }, [copy.appTitle, language]);

  const filtered = useMemo(() => filterWifiHotspots(hotspots, filters), [hotspots, filters]);
  const summary = useMemo(() => buildWifiSummary(filtered), [filtered]);
  const options = useMemo(
    () => buildFilterOptions(hotspots, language),
    [hotspots, language],
  );
  const nearby = useMemo(
    () => userLocation ? getNearbyHotspots(filtered, userLocation, radius) : [],
    [filtered, radius, userLocation],
  );

  const locate = () => {
    setLocationError(false);
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setLocationError(true),
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
                  <p>{copy.mapResultCount}: <strong>{filtered.filter(hasValidCoordinates).length.toLocaleString()}</strong></p>
                </div>
                <WifiMap hotspots={filtered} language={language} copy={copy} userLocation={userLocation} />
              </section>
            )}
            {active === 'nearby' && (
              <>
                <div className="nearby-map"><WifiMap hotspots={nearby.map((item) => item.hotspot)} language={language} copy={copy} userLocation={userLocation} /></div>
                <NearbyWifiHotspots nearby={nearby} language={language} copy={copy} radius={radius} onRadiusChange={setRadius} onLocate={locate} error={locationError ? copy.unableToGetLocation : ''} hasLocation={Boolean(userLocation)} />
              </>
            )}
            {active === 'directory' && <HotspotDirectory hotspots={filtered} language={language} copy={copy} />}
            {active === 'overview' && <DataOverviewDashboard summary={summary} hotspots={filtered} language={language} copy={copy} />}
            {active === 'notes' && <DataNotes copy={copy} />}
          </>
        )}
      </main>
      <Footer copy={copy} />
    </>
  );
}
