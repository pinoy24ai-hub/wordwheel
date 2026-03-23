/* ══════════════════════════════════════════════
   WordWheel — Service Worker (sw.js)
   Cache-first strategy for full offline play.

   DEPLOY INSTRUCTION: bump CACHE_NAME to the
   current UTC timestamp (YYYYMMDDHHMMSS) every
   time you push a new version.  The activate
   handler below automatically deletes every
   cache whose name doesn't match, so old cached
   files are evicted the moment the new SW takes
   control.
   ══════════════════════════════════════════════ */

const CACHE_NAME = 'wordwheel-20260322143000';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './words.js',
  './bonus-words.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

/* ── Install: pre-cache all game files ───────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: remove stale caches ──────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first, fall back to network ── */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache new valid responses for same-origin requests
        if (
          response.ok &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
