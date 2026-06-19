// Odosan service worker — app-shell caching for PWA install + offline tolerance.
// Bump CACHE_VERSION any time you change shell behavior so old clients refresh.

const CACHE_VERSION = 'odosan-v3';
const SHELL_URLS = [
  '/',
  '/diagnose',
  '/my-home',
  '/for-providers',
  '/territory',
  '/privacy',
  '/support',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Don't touch non-GET or cross-origin requests.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // NEVER cache API routes — they're dynamic and contain user data.
  if (new URL(req.url).pathname.startsWith('/api/')) return;

  // Network-first for HTML navigations so users see updated pages when online.
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Cache-first for static assets (CSS/JS/images/fonts).
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
    )
  );
});
