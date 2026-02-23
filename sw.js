const CACHE_NAME = 'goja-v7.4.0-1';
const ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/style.css',
  './js/app.js',
  './js/app-bootstrap.js',
  './js/config.js',
  './js/state.js',
  './js/layout-engine.js',
  './js/layout-templates.js',
  './js/templates-small.js',
  './js/templates-large.js',
  './js/image-processor.js',
  './js/image-effects.js',
  './js/export-handler.js',
  './js/export-options.js',
  './js/export-worker.js',
  './js/toast.js',
  './js/cell-context-menu.js',
  './js/cell-keyboard-nav.js',
  './js/utils.js',
  './js/exif.js',
  './js/capture-date-overlay.js',
  './js/vendor/exifr.mjs',
  './js/version.js',
  './js/drag-handler.js',
  './js/watermark.js',
  './js/grid-effects-settings.js',
  './js/update-banner.js',
  './js/template-storage.js',
  './js/preview-renderer.js',
  './js/photo-loader.js',
  './js/export-flow.js',
  './js/preview-updater.js',
  './js/app-init.js',
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
