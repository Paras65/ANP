// Ambition News Portal - High-Performance PWA Service Worker
const CACHE_NAME = 'anp-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo-192.png',
  '/logo-512.png',
  '/logo-maskable.png',
  '/favicon.svg'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial failure:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event Strategy:
// 1. Navigation (HTML pages): Network-First, fallback to cached /index.html
// 2. Static Assets (CSS, JS, Fonts, Images): Cache-First / Stale-While-Revalidate
// 3. API / External Media: Network-First with safe fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and admin portal / API mutations
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/admin') || url.pathname.includes('/api/auth')) return;

  // 1. HTML Navigation Requests (Network-First)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. Static Assets & Images (Stale-While-Revalidate)
  const isStatic = 
    url.origin === self.location.origin && 
    (url.pathname.startsWith('/assets/') || 
     url.pathname.endsWith('.png') || 
     url.pathname.endsWith('.jpg') || 
     url.pathname.endsWith('.svg') || 
     url.pathname.endsWith('.ico') || 
     url.pathname.endsWith('.css') || 
     url.pathname.endsWith('.js') || 
     url.pathname.endsWith('.json'));

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. All other requests: Network-First with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        return new Response('Network offline', { status: 503, statusText: 'Offline' });
      })
  );
});
