const BASE = '/taipei-free-wifi-map/';
const CACHE = 'taipei-wifi-v2';
const ASSETS = [BASE, `${BASE}data/wifi-hotspots.json`, `${BASE}data/wifi-summary.json`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const fetchAndCache = () => fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  });
  if (url.pathname.startsWith(`${BASE}data/`)) {
    event.respondWith(
      fetchAndCache().catch(async () => (await caches.match(event.request)) || Response.error()),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetchAndCache()),
  );
});
