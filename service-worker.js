// METAVERSE Service Worker - improved offline behavior
const CACHE_NAME = 'metaverse-v1.0.1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './website777.html',
  './web777game.html',
  './manifest.json',
  './offline.html'
];

// Install - pre-cache same-origin assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(err => {
        // If precache partially fails, log but allow SW to install
        console.warn('⚠️ Precaching failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => (key !== CACHE_NAME) ? caches.delete(key) : Promise.resolve())
    ))
  );
  self.clients.claim();
});

// Fetch - network-first for navigation, cache-first for same-origin assets
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Handle navigation requests (HTML pages)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(networkResponse => {
          // Update cached index.html for SPA navigations
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails, serve cached page or offline fallback
          return caches.match(req).then(cached => cached || caches.match('./offline.html'));
        })
    );
    return;
  }

  // Same-origin assets: try cache first, then network (and cache the result)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkResponse => {
          // Only cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const respClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, respClone).catch(() => { /* ignore put failures */ });
            });
          }
          return networkResponse;
        }).catch(() => {
          // On failure, for images or others you could return a fallback; default to offline.html for unknown assets
          return caches.match('./offline.html');
        });
      })
    );
    return;
  }

  // Cross-origin requests (CDN etc) - try network, fallback to cache/offline
  event.respondWith(
    fetch(req).catch(() => caches.match('./offline.html'))
  );
});

// Support skipWaiting from the page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
