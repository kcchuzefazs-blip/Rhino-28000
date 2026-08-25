const CACHE_NAME = 'rhino-store-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Cache the app shell (the page itself) on install so it opens instantly
// and still works if the network is briefly unavailable. Live data
// (products, orders) always comes fresh from Firebase over the network —
// this only caches the app's own files, never your store data.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Never cache Firebase calls — those must always hit the network so
  // prices/stock/orders stay live.
  if (url.includes('firebaseio.com')) {
    return;
  }

  // App shell files: try the network first, fall back to cache if offline.
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
