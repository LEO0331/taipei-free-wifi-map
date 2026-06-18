import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Language, WifiHotspot, WifiHotspotCategory } from '../types';
import type { Translation } from '../translations';
import { getGoogleMapsUrl } from '../lib/wifi';
import { getHotspotText } from '../lib/view';

const markerEmoji: Record<WifiHotspotCategory, string> = {
  bus_station: '🚌',
  government_office: '🏛️',
  hospital: '🏥',
  market_shopping: '🛍️',
  library: '📚',
  community_center: '🏘️',
  arts_culture: '🎭',
  public_service: '📶',
  sports_venue: '🏟️',
  park: '🌳',
  public_transport: '🚇',
  tourist_attraction: '📍',
  visitor_center: '🧭',
  other: '📶',
};

function popupContent(hotspot: WifiHotspot, language: Language, copy: Translation) {
  const text = getHotspotText(hotspot, language);
  const root = document.createElement('div');
  root.className = 'wifi-popup';
  const title = document.createElement('strong');
  title.textContent = text.name;
  root.append(title);
  [
    [copy.hotspotType, text.type],
    [copy.district, text.area],
    [copy.address, text.address],
    [copy.agency, text.agency],
    [copy.hotspotId, hotspot.hotspotId],
    [copy.vendor, hotspot.vendorId],
  ].forEach(([label, value]) => {
    if (!value) return;
    const line = document.createElement('p');
    const term = document.createElement('b');
    term.textContent = `${label}: `;
    line.append(term, value);
    root.append(line);
  });
  if (hotspot.latitude !== undefined && hotspot.longitude !== undefined) {
    const link = document.createElement('a');
    link.href = getGoogleMapsUrl(hotspot.latitude, hotspot.longitude);
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = copy.openGoogleMaps;
    root.append(link);
  }
  return root;
}

export function WifiMap({
  hotspots,
  language,
  copy,
  userLocation,
}: {
  hotspots: WifiHotspot[];
  language: Language;
  copy: Translation;
  userLocation?: { latitude: number; longitude: number };
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const clusters = useRef<L.MarkerClusterGroup | null>(null);
  const userMarker = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    map.current = L.map(container.current, { zoomControl: false }).setView([25.0478, 121.5319], 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);
    clusters.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 52,
      chunkedLoading: true,
    }).addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = clusters.current;
    if (!layer) return;
    layer.clearLayers();
    hotspots
      .filter((hotspot) => hotspot.coordinateStatus === 'valid' && hotspot.latitude !== undefined && hotspot.longitude !== undefined)
      .forEach((hotspot) => {
        const icon = L.divIcon({
          className: 'wifi-marker',
          html: `<span>${markerEmoji[hotspot.hotspotCategory]}</span>`,
          iconSize: [34, 40],
          iconAnchor: [17, 38],
        });
        L.marker([hotspot.latitude!, hotspot.longitude!], { icon })
          .bindPopup(popupContent(hotspot, language, copy), { maxWidth: 290 })
          .addTo(layer);
      });
  }, [hotspots, language, copy]);

  useEffect(() => {
    if (!map.current || !userLocation) return;
    userMarker.current?.remove();
    userMarker.current = L.circleMarker([userLocation.latitude, userLocation.longitude], {
      radius: 9,
      color: '#fff',
      weight: 3,
      fillColor: '#e84a2a',
      fillOpacity: 1,
    }).addTo(map.current);
    map.current.setView([userLocation.latitude, userLocation.longitude], 16);
  }, [userLocation]);

  return <div className="map-frame" ref={container} aria-label={copy.wifiMap} />;
}
