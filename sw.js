// ─── Cambiá este número cada vez que hacés deploy ───────────────────────────
const CACHE_VERSION = 6;
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
  if (event.request.method !== 'GET') return; // POST & cía: directo a la red (no se cachean)
  const url = new URL(event.request.url);

  // API calls: siempre network, nunca caché
  if (url.hostname.includes('workers.dev') || url.hostname.includes('mercadolibre')) {
    return; // deja pasar sin interceptar
  }

  // index.html: NETWORK FIRST → si falla la red, caché como fallback
  // Así siempre ve la versión nueva cuando hay conexión.
  if (url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      // cache:'no-cache' = preguntarle SIEMPRE a GitHub si hay versión nueva (si no
      // cambió responde "304", rapidísimo). Sin esto, el caché del navegador (GitHub
      // pone max-age=600) servía la versión VIEJA hasta 10 minutos después de subirla.
      fetch(event.request.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(response => {
          // Guardamos la versión nueva en caché
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        // offline: servir lo que hay (aunque la URL traiga ?algo)
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
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

// ── Avisos al celular (los manda el Worker mikra-historial; se activan con 🔔 en la app) ──
// Resumen del día a la hora elegida (lun–vie) y la prueba de 1 aviso por minuto.
self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || '📦 Despachos', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'badge-96.png',
    tag: d.tag || 'resumen',
    renotify: true,
    data: { url: d.url || './' },
  }));
});

// Tocar el aviso → abre el Resumen (o lo trae al frente si ya estaba abierto)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const w = ws.find(x => x.url.startsWith(self.registration.scope));
    return w ? w.focus() : self.clients.openWindow(url);
  }));
});
