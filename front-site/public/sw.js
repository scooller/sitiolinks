// Simple service worker for static asset + image caching
const STATIC_CACHE = 'static-v3';
const IMG_CACHE = 'img-v3';
const STATIC_ASSETS = [
  '/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![STATIC_CACHE, IMG_CACHE].includes(k)).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Skip Vite HMR, dev modules, and API requests
  if (
    url.pathname.includes('node_modules') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('@react-refresh') ||
    url.pathname.match(/\.(tsx?|jsx?)(\?|$)/) ||
    url.pathname.includes('/__vite') ||
    url.pathname.startsWith('/src/') ||
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/graphql')
  ) {
    return; // Don't intercept, let browser handle
  }

  // Images: cache-first with background update
  if (url.pathname.match(/\.(png|jpe?g|webp|gif|svg|ico)$/i)) {
    event.respondWith(
      caches.open(IMG_CACHE).then(cache => 
        cache.match(req).then(cached => {
          const fetchPromise = fetch(req).then(res => {
            if (res.status === 200) cache.put(req, res.clone());
            return res;
          }).catch(() => cached || Response.error());
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Static assets: stale-while-revalidate (only for production builds)
  if (url.pathname.match(/\.(css|js|woff2?|ttf|eot)$/i)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => 
        cache.match(req).then(cached => {
          const fetchPromise = fetch(req).then(res => {
            if (res.status === 200) cache.put(req, res.clone());
            return res;
          }).catch(() => cached || Response.error());
          return cached || fetchPromise;
        })
      )
    );
  }
});
