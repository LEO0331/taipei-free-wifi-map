import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Language } from '../types';

export interface GeographicMapPoint { id: string; name: string; latitude: number; longitude: number }

export default function WifiGeographicMap({ points, hotspots, distance, language, showCircles, boundaries }: {
  points: GeographicMapPoint[]; hotspots: GeographicMapPoint[]; distance: number; language: Language; showCircles: boolean; boundaries?: GeoJSON.GeoJsonObject;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlays = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (!container.current) return;
    map.current = L.map(container.current).setView([25.055, 121.54], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map.current);
    overlays.current = L.layerGroup().addTo(map.current);
    const observer = new ResizeObserver(() => map.current?.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const layer = overlays.current;
    if (!layer) return;
    layer.clearLayers();
    if (boundaries) L.geoJSON(boundaries, { style: { color: '#526374', weight: 1, fillOpacity: 0.025 } }).addTo(layer);
    for (const point of hotspots) {
      const label = document.createElement('span');
      label.textContent = `${language === 'zh' ? '已公布熱點' : 'Published hotspot'} · ${point.id}`;
      L.circleMarker([point.latitude, point.longitude], { radius: 4, color: '#7a8590', fillOpacity: 0.5 }).bindPopup(label).addTo(layer);
    }
    for (const point of points) {
      const label = document.createElement('span'); label.textContent = `${point.name} · ${point.id}`;
      if (showCircles) L.circle([point.latitude, point.longitude], { radius: distance, color: '#156a8a', weight: 1, fillOpacity: 0.07 }).addTo(layer);
      L.circleMarker([point.latitude, point.longitude], { radius: 7, color: '#b83d26', fillColor: '#e84a2a', fillOpacity: 1 }).bindPopup(label).addTo(layer);
    }
  }, [points, hotspots, distance, language, showCircles, boundaries]);
  return <div ref={container} className="geo-map" role="region" aria-label={language === 'zh' ? '實驗性幾何近鄰研究地圖；下方表格提供相同候選紀錄' : 'Experimental geometric proximity map; the table below provides the same candidate records'} />;
}
