const CACHE_VERSION = "v2";
const STATIC_CACHE_NAME = `sports-org-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `sports-org-dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.svg"];

const CACHEABLE_EXTENSIONS = [
  ".js",
  ".css",
  ".woff",
  ".woff2",
  ".ttf",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".ico",
  ".webp",
];

function is_cacheable_request(request) {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return false;
  }

  if (url.origin !== self.location.origin) {
    return false;
  }

  const is_static_asset = CACHEABLE_EXTENSIONS.some((ext) =>
    url.pathname.endsWith(ext),
  );
  const is_page_request =
    request.mode === "navigate" || request.destination === "document";

  return is_static_asset || is_page_request;
}

function is_static_asset(request) {
  const url = new URL(request.url);
  const is_sveltekit_chunk =
    url.pathname.startsWith("/_app/") ||
    url.pathname.startsWith("/.svelte-kit/");
  if (is_sveltekit_chunk) {
    return false;
  }
  return CACHEABLE_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

self.addEventListener("install", function (event) {
  console.log("[PWA] Installing service worker...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then(function (cache) {
        console.log("[PWA] Pre-caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function () {
        console.log("[PWA] Service worker installed");
        return self.skipWaiting();
      })
      .catch(function (error) {
        console.log("[PWA] Pre-cache failed:", error);
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", function (event) {
  console.log("[PWA] Activating service worker...");

  event.waitUntil(
    caches
      .keys()
      .then(function (cache_names) {
        return Promise.all(
          cache_names
            .filter(function (cache_name) {
              return (
                cache_name.startsWith("sports-org-") &&
                cache_name !== STATIC_CACHE_NAME &&
                cache_name !== DYNAMIC_CACHE_NAME
              );
            })
            .map(function (cache_name) {
              console.log("[PWA] Deleting old cache:", cache_name);
              return caches.delete(cache_name);
            }),
        );
      })
      .then(function () {
        console.log("[PWA] Service worker activated");
        return self.clients.claim();
      }),
  );
});

self.addEventListener("fetch", function (event) {
  if (!is_cacheable_request(event.request)) {
    return;
  }

  if (is_static_asset(event.request)) {
    event.respondWith(cache_first_strategy(event.request));
  } else {
    event.respondWith(network_first_strategy(event.request));
  }
});

function cache_first_strategy(request) {
  return caches.match(request).then(function (cached_response) {
    if (cached_response) {
      return cached_response;
    }

    return fetch(request)
      .then(function (network_response) {
        if (network_response.ok) {
          const response_clone = network_response.clone();
          caches.open(STATIC_CACHE_NAME).then(function (cache) {
            cache.put(request, response_clone);
          });
        }
        return network_response;
      })
      .catch(function () {
        return new Response("Offline - asset not cached", {
          status: 503,
          statusText: "Service Unavailable",
        });
      });
  });
}

function network_first_strategy(request) {
  return fetch(request)
    .then(function (network_response) {
      if (network_response.ok) {
        const response_clone = network_response.clone();
        caches.open(DYNAMIC_CACHE_NAME).then(function (cache) {
          cache.put(request, response_clone);
        });
      }
      return network_response;
    })
    .catch(function () {
      return caches.match(request).then(function (cached_response) {
        if (cached_response) {
          return cached_response;
        }

        if (request.mode === "navigate") {
          return caches.match("/");
        }

        return new Response("Offline - page not cached", {
          status: 503,
          statusText: "Service Unavailable",
        });
      });
    });
}
