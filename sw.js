const CACHE = 'valo-check-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/public/style.css',
  '/public/main.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/about',
  '/privacy',
  '/terms',
  '/cookies'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Firebase & API calls — network only
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.hostname.includes('openrouter') || url.hostname.includes('ipwho')) {
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const clone = response.clone();
      if (response.ok && request.method === 'GET') caches.open(CACHE).then(cache => cache.put(request, clone));
      return response;
    }).catch(() => caches.match('/index.html')))
  );
});
