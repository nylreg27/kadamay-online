const CACHE_NAME = 'kadamay-v3';
const urlsToCache = [
  '/',
  '/static/images/kadamay_logo.png',
  // Add your static CSS/JS files here if any
  // For example: '/static/css/custom.css', '/static/js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if found
        if (response) {
          return response;
        }
        // Otherwise fetch from network, and optionally cache for future
        return fetch(event.request).then(networkResponse => {
          // Cache only static assets — never cache API or Supabase responses
          if (event.request.method === 'GET' &&
              event.request.url.indexOf('chrome-extension') === -1 &&
              event.request.url.indexOf('supabase.co') === -1 &&
              event.request.url.indexOf('/api/') === -1) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // If offline and request is for a page, show a fallback offline page
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
        // Otherwise return a generic error response
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});