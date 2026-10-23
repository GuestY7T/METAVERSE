// METAVERSE Service Worker - safer offline cache handling
const CACHE_NAME = 'metaverse-v4';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './player-foundation.js',
  './metaverse-shared-sync-v1.js',
  './metaverse-connect-bridge.js',
  './runtime-foundation.js',
  './vendor/three.0.128.0.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(err => {
        console.warn('⚠️ Precaching failed:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('./offline.html')
            .then(fallback => fallback || Response.error());
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(req) || Response.error();
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
