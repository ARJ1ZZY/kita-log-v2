const CACHE_NAME = 'kita-log-v1';
const urlsToCache = [
    '/KITA-LOG/',
    '/KITA-LOG/web_dashboard.php',
    '/KITA-LOG/assets/css/global-theme.css'
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
        .then(response => response || fetch(event.request))
    );
});