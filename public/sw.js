// public/sw.js - SNAP APP Native PWA Service Worker
const CACHE_NAME = "snap-app-pwa-v1";
const PRECACHE_ASSETS = [
  "/offline",
  "/manifest.json",
  "/LOGO.svg",
  "/favicon.svg",
  "/favicon.png",
  "/icon-192.png",
];

// Install: Pre-cache offline shell & static assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Pre-cache warning:", err);
      });
    })
  );
});

// Activate: Clean up stale caches & take immediate control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Native App Immersion Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET, chrome-extension, and API telemetry routes
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 1. Navigation Requests: Network-First with /offline fallback (prevents iOS Safari URL drop-down)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache latest HTML if successful
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Device is offline: Serve cached route or /offline shell
          const cache = await caches.open(CACHE_NAME);
          const matched = await cache.match(request);
          if (matched) return matched;
          const offlinePage = await cache.match("/offline");
          return offlinePage || new Response("Offline", {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts): Stale-While-Revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
