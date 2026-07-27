const CACHE_NAME = "lms-filmes-v1";

// Cache static app shell resources
const PRECACHE_ASSETS = [
  "/filmes",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/placeholder-movie.jpg",
  "/placeholder-user.jpg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("PWA precache optional error:", err);
      });
    })
  );
});

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

self.addEventListener("fetch", (event) => {
  // Only handle GET requests for navigation and static assets
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Avoid caching API calls to keep backend data fresh
  if (url.pathname.startsWith("/lms-") || url.pathname.includes("/api/")) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("/filmes");
        });
      })
    );
  }
});
