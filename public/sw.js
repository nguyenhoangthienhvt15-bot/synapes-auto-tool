// ==============================================================================
// SYNAPES Studio High-Speed Service Worker (Zero-Latency Instant App Shell)
// ==============================================================================

const CACHE_NAME = 'synapes-studio-v3';
const STATIC_ASSETS = [
  '/logo.jpg',
  '/con_dau_do_tron_ks_nguyen_hoang_thien.png',
  '/stamp-truong-ban.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only manage same-origin static assets & shell navigation; never intercept cross-origin or sw.js
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/healthz') ||
    url.pathname.startsWith('/ping')
  ) {
    return;
  }

  // Immutable hashed assets (/assets/*.js, /assets/*.css): Cache-First only if non-HTML valid asset
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          const cachedType = cachedResponse.headers.get('content-type') || '';
          if (!cachedType.includes('text/html')) {
            return cachedResponse;
          }
        }
        return fetch(event.request).then((networkResponse) => {
          const contentType = networkResponse.headers.get('content-type') || '';
          if (networkResponse.ok && !contentType.includes('text/html')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // HTML page navigations: Network-First so new deployments activate immediately
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Other same-origin static files (images/icons): Stale-While-Revalidate without HTML fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          const contentType = networkResponse.headers.get('content-type') || '';
          if (networkResponse.ok && !contentType.includes('text/html')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
});
