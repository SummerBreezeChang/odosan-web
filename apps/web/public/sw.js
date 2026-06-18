// Simple service worker for PWA support
// Future: Add offline caching for diagnosis history

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through for now, can add caching strategies later
  event.respondWith(fetch(event.request));
});
