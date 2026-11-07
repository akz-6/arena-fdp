const CACHE_NAME = 'arena-fdp-v2';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/local',
  '/regras',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Apenas requisições GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 2. NUNCA interceptar nem cachear:
  // - Outras origens
  // - Chamadas de API (/api/*)
  // - Domínios do Supabase (REST, Realtime WebSocket)
  // - Rotas de salas online (/sala/*) - sempre rede fresca para evitar HTML velho
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/sala/') ||
    url.hostname.includes('supabase.co')
  ) {
    return;
  }

  // 3. Assets estáticos versionados: Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 4. Navegações (páginas HTML offline-first como /local e /regras): Network-First com fallback de cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/local');
          return fallback || (await caches.match('/'));
        })
    );
    return;
  }
});
