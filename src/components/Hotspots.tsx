import { useEffect, useState } from 'react';
import type { Language, WifiHotspot } from '../types';
import type { Translation } from '../translations';
import { formatDistance, getGoogleMapsUrl } from '../lib/wifi';
import { getHotspotText } from '../lib/view';

export function HotspotCard({
  hotspot,
  language,
  copy,
  distance,
}: {
  hotspot: WifiHotspot;
  language: Language;
  copy: Translation;
  distance?: number;
}) {
  const text = getHotspotText(hotspot, language);
  return (
    <article className="hotspot-card">
      <div className="card-heading">
        <div>
          <span className="eyebrow">{text.type}</span>
          <h3>{text.name}</h3>
        </div>
        {!hotspot.isTaipeiCity && <span className="outside-badge">{copy.outsideBadge}</span>}
      </div>
      <dl>
        <div><dt>{copy.district}</dt><dd>{text.area || '—'}</dd></div>
        <div><dt>{copy.address}</dt><dd>{text.address}</dd></div>
        {text.agency && <div><dt>{copy.agency}</dt><dd>{text.agency}</dd></div>}
        {hotspot.vendorId && <div><dt>{copy.vendor}</dt><dd>{hotspot.vendorId}</dd></div>}
      </dl>
      <div className="card-actions">
        {distance !== undefined && <strong>{formatDistance(distance, language)}</strong>}
        {hotspot.latitude !== undefined && hotspot.longitude !== undefined && (
          <a href={getGoogleMapsUrl(hotspot.latitude, hotspot.longitude)} target="_blank" rel="noreferrer">
            {copy.openGoogleMaps} ↗
          </a>
        )}
      </div>
    </article>
  );
}

export function HotspotDirectory({
  hotspots,
  language,
  copy,
}: {
  hotspots: WifiHotspot[];
  language: Language;
  copy: Translation;
}) {
  const [visible, setVisible] = useState(48);
  useEffect(() => setVisible(48), [hotspots]);
  return (
    <section className="content-section">
      <div className="section-heading">
        <div><span className="section-number">03</span><h2>{copy.hotspotDirectory}</h2></div>
        <p>{hotspots.length.toLocaleString()} {copy.listedHotspots}</p>
      </div>
      {hotspots.length ? (
        <>
          <div className="directory-grid">
            {hotspots.slice(0, visible).map((hotspot) => (
              <HotspotCard key={hotspot.id} hotspot={hotspot} language={language} copy={copy} />
            ))}
          </div>
          {visible < hotspots.length && (
            <button className="load-more" onClick={() => setVisible((count) => count + 48)}>
              {copy.loadMore}
            </button>
          )}
        </>
      ) : <p className="empty-state">{copy.noResults}</p>}
    </section>
  );
}

export function NearbyWifiHotspots({
  nearby,
  language,
  copy,
  radius,
  onRadiusChange,
  onLocate,
  error,
  hasLocation,
}: {
  nearby: Array<{ hotspot: WifiHotspot; distance: number }>;
  language: Language;
  copy: Translation;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onLocate: () => void;
  error: string;
  hasLocation: boolean;
}) {
  return (
    <section className="content-section nearby-section">
      <div className="section-heading">
        <div><span className="section-number">02</span><h2>{copy.nearbyHotspots}</h2></div>
        {hasLocation && <p>{nearby.length.toLocaleString()} {copy.listedHotspots}</p>}
      </div>
      <div className="nearby-controls">
        <button className="primary-button" onClick={onLocate}>◎ {copy.showNearbyWifi}</button>
        <label>{copy.radius}
          <select value={radius} onChange={(event) => onRadiusChange(Number(event.target.value))}>
            <option value={300}>300m</option>
            <option value={500}>500m</option>
            <option value={1000}>1km</option>
            <option value={2000}>2km</option>
          </select>
        </label>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {hasLocation && <p className="location-ready">● {copy.locationReady}</p>}
      <div className="directory-grid">
        {nearby.map(({ hotspot, distance }) => (
          <HotspotCard key={hotspot.id} hotspot={hotspot} distance={distance} language={language} copy={copy} />
        ))}
      </div>
      {hasLocation && nearby.length === 0 && <p className="empty-state">{copy.noResults}</p>}
    </section>
  );
}
