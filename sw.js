const CACHE_VERSION = 'viking-security-20260513';
const CACHE_NAME = CACHE_VERSION;
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
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
  const url = new URL(e.request.url);
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(e.request)
        .then(r => { const c=r.clone(); caches.open(CACHE_NAME).then(ch=>ch.put(e.request,c)); return r; })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(r => {
        if(!r||r.status!==200||r.type!=='basic') return r;
        const c=r.clone(); caches.open(CACHE_NAME).then(ch=>ch.put(e.request,c)); return r;
      });
    }).catch(() => caches.match('/index.html'))
  );
});

self.addEventListener('message', e => {
  if(e.data&&e.data.type==='SKIP_WAITING') self.skipWaiting();
});
