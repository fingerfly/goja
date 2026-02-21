const CACHE_NAME = 'goja-v1.0.0-1';
const ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/style.css',
  './js/app.js',
  './js/layout-engine.js',
  './js/layout-templates.js',
  './js/templates-small.js',
  './js/templates-large.js',
  './js/image-processor.js',
  './js/export-handler.js',
  './js/utils.js',
  './js/version.js',
  './js/drag-handler.js',
  './js/watermark.js',
  './js/settings-panel.js',
  './assets/logo.svg',
  './assets/logo-192.svg',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
