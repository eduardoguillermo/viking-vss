const CACHE_NAME = 'viking-vss-v1';
const ASSETS = [
  '/viking-vss/',
  '/viking-vss/index.html',
  '/viking-vss/app.js',
  '/viking-vss/app.css',
  '/viking-vss/logo.png',
  '/viking-vss/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return response;
      });
    }).catch(() => caches.match('/viking-vss/index.html'))
  );
});
