const CACHE_NAME = 'goja-v4.0.0-3';
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
  './js/resize-engine.js',
  './js/resize-handler.js',
  './js/i18n.js',
  './js/locales/en.js',
  './js/locales/zh-Hans.js',
  './js/locales/zh-Hant.js',
  './js/locales/de.js',
  './js/locales/nl.js',
  './js/locales/es.js',
  './js/locales/it.js',
  './js/locales/tr.js',
  './js/locales/fi.js',
  './js/locales/ja.js',
  './js/locales/eo.js',
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
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
