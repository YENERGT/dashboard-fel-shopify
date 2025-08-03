// Service Worker para caché de la aplicación
const CACHE_NAME = 'dashboard-fel-v1';
const STATIC_CACHE = 'static-v1';
const DATA_CACHE = 'data-v1';

// Archivos estáticos para cachear
const STATIC_FILES = [
  '/',
  '/app',
  '/app/dashboard',
  '/manifest.json',
  // CSS crítico
  '/assets/tokens.css',
  '/assets/dashboard-enhanced.css',
  // Scripts esenciales
  'https://unpkg.com/nprogress@0.2.0/nprogress.js',
  'https://unpkg.com/nprogress@0.2.0/nprogress.css'
];

// URLs de API para cache con estrategia
const API_URLS = [
  '/api/dashboard',
  '/api/financial'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES)),
      caches.open(DATA_CACHE)
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia para archivos estáticos
  if (STATIC_FILES.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          const responseClone = fetchResponse.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return fetchResponse;
        });
      })
    );
    return;
  }

  // Estrategia para datos del dashboard (stale-while-revalidate)
  if (url.pathname.includes('/app/dashboard') || url.pathname.includes('/app/analisis-financiero')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }).catch(() => cachedResponse); // Fallback a cache si falla la red

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Para todo lo demás, solo red
  event.respondWith(fetch(request));
});

// Mensaje del cliente para limpiar cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(DATA_CACHE).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Notificar cuando hay una nueva versión disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
