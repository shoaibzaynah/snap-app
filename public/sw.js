// public/sw.js - SNAP APP Native PWA Service Worker v3
const CACHE_NAME = "snap-app-pwa-v3";
const PRECACHE_ASSETS = [
  "/offline.html",
  "/LOGO.svg",
  "/favicon.svg",
  "/favicon.png",
  "/icon-192.png",
  "/manifest.json",
];

const FALLBACK_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>SNAP APP</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}.badge{background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);color:#f59e0b;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:16px}h1{font-size:22px;font-weight:900;margin-bottom:8px}p{font-size:13px;color:rgba(255,255,255,.6);max-width:300px;margin-bottom:20px;line-height:1.5}.btn{background:#FFFC00;color:#000;font-weight:900;padding:12px 28px;border-radius:999px;border:none;font-size:14px;cursor:pointer}</style></head><body><div class="badge">Offline Mode</div><h1>Connection Lost</h1><p>SNAP APP is waiting for connection. The app will automatically reload when internet returns.</p><button class="btn" onclick="location.href='/admin'">Retry Now</button><script>function r(){if(navigator.onLine){fetch('/api/companion/version',{method:'HEAD',cache:'no-store'}).then(function(){location.href='/admin'}).catch(function(){})}}window.addEventListener('online',r);setInterval(r,1500);</script></body></html>`;

// Install: Pre-cache offline shell
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

// Activate: Purge obsolete caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Native App Immersion Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // 1. Navigation Requests: Network-First with /offline.html & inline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          if (cached) return cached;
          const offlinePage = await cache.match("/offline.html");
          if (offlinePage) return offlinePage;
          return new Response(FALLBACK_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }

  // 2. Next.js RSC Prefetches / Link Clicks
  if (url.searchParams.has("_rsc") || request.headers.get("RSC")) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        return cached || new Response("", { status: 200, headers: { "Content-Type": "text/x-component" } });
      })
    );
    return;
  }

  // 3. Static Assets: Cache First with Network Fallback
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
