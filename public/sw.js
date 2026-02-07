const CACHE_NAME = "critiqs-v1";
const STATIC_ASSETS = ["/", "/index.html", "/favicon.ico", "/placeholder.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Network-first for API/supabase calls
  if (request.url.includes("supabase") || request.url.includes("/functions/")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
      const clone = resp.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return resp;
    }))
  );
});
