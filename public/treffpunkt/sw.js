const CACHE_NAME = "hoodometer-karlsruhe-v4";
const ASSETS = [
  "/treffpunkt/manifest.webmanifest",
  "/treffpunkt/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : undefined)))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || event.request.method !== "GET") return;
  if (event.request.mode === "navigate" || event.request.destination === "document") return;
  if (!ASSETS.includes(requestUrl.pathname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
