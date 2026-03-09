const CACHE_NAME = "critiqs-v2";
const STATIC_ASSETS = ["/", "/index.html", "/favicon.png"];

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

  // Never cache OAuth routes
  if (request.url.includes("/~oauth")) return;

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

// Handle scheduled notification alarms
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCHEDULE_NOTIFICATION") {
    const { title, body, time, tag } = event.data;
    const now = Date.now();
    const delay = time - now;

    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          icon: "/favicon.png",
          badge: "/favicon.png",
          tag,
          vibrate: [200, 100, 200],
          requireInteraction: true,
          actions: [
            { action: "open", title: "Open CRITIQS" },
            { action: "dismiss", title: "Dismiss" },
          ],
        });
      }, delay);
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});