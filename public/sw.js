const STATIC_CACHE = "internship-tracker-static-v2";
const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    void fetch(request)
      .then((response) => {
        if (response.ok) {
          void cache.put(request, response.clone());
        }
      })
      .catch(() => undefined);

    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    void cache.put(request, response.clone());
  }

  return response;
}

async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match("/offline")) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "worker" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheStaticAsset(request));
  }
});
