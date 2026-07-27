const CACHE_NAME = "ecommerce-v2";
const STATIC_ASSETS = ["/", "/offline.html"];

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

    // Never intercept non-GET requests (orders, inventory updates, etc.)
    if (request.method !== "GET") return;

    // API calls: network-first, don't cache
    if (request.url.includes("/api/")) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Static assets: cache-first, fallback to network, fallback to offline page
    event.respondWith(
        caches.match(request).then(cached => {
            return cached || fetch(request).catch(() => caches.match("/offline.html"));
        })
    );
});