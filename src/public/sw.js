const CACHE_NAME = "ecommerce-v2";
const STATIC_ASSETS = ["/"];

// Install: cache static shell
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: network-first for API/data, cache-first for static assets
self.addEventListener("fetch", event => {
    const { request } = event;

    if (request.method !== "GET") return;

    if (request.url.includes("/api/")) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => {
            return cached || fetch(request);
        })
    );
});