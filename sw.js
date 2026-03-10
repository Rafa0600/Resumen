// ─── Cambiá este número cada vez que hacés deploy ───────────────────────────
const CACHE_VERSION = 4;
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = `despachos-v${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap'
];

// ── INSTALL: pre-cachear sólo assets estáticos (NO el HTML) ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())   // activa el SW nuevo sin esperar que cierren las tabs
  );
});

// ── ACTIVATE: borrar caches viejos ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // toma control de todas las tabs abiertas
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls: siempre network, nunca caché
  if (url.hostname.includes('workers.dev') || url.hostname.includes('mercadolibre')) {
    return; // deja pasar sin interceptar
  }

  // index.html: NETWORK FIRST → si falla la red, caché como fallback
  // Así siempre ve la versión nueva cuando hay conexión.
  if (url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Guardamos la versión nueva en caché
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // offline: servir lo que hay
    );
    return;
  }

  // Resto (fonts, manifest, iconos): CACHE FIRST → network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ── Mensaje desde la página para forzar update ───────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
