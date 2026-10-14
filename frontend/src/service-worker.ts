import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  build_service_worker_cache_name,
  classify_service_worker_request,
  list_stale_service_worker_caches,
  SERVICE_WORKER_STRATEGY,
  type ServiceWorkerRoutingContext,
} from "$lib/infrastructure/pwa/serviceWorkerRouting";
import {
  respond_cache_first,
  respond_navigation_with_shell_fallback,
  respond_network_first,
  type ServiceWorkerStrategyPorts,
} from "$lib/infrastructure/pwa/serviceWorkerStrategies";
import type {
  ServiceWorkerExtendableEvent,
  ServiceWorkerFetchEvent,
  ServiceWorkerScope,
} from "$lib/infrastructure/pwa/serviceWorkerTypes";
import { build, files, version } from "$service-worker";

const worker_scope = self as unknown as ServiceWorkerScope;
const APP_SHELL_PATH = "/";
const NETWORK_TIMEOUT_MS = 3000;
const PASSTHROUGH_PATH_PREFIXES = ["/__clerk", "/api/"] as const;
const CACHE_NAME = build_service_worker_cache_name(version);
const PRECACHED_PATHS = [...build, ...files];
const SERVICE_WORKER_EVENT = {
  PRECACHED: "service_worker_precached",
  SHELL_PRECACHE_FAILED: "service_worker_shell_precache_failed",
  STALE_CACHES_REMOVED: "service_worker_stale_caches_removed",
  NETWORK_FAILED: "service_worker_network_failed",
  CACHE_WRITE_FAILED: "service_worker_cache_write_failed",
} as const;

const routing_context: ServiceWorkerRoutingContext = {
  app_origin: worker_scope.location.origin,
  precached_paths: new Set(PRECACHED_PATHS),
  passthrough_path_prefixes: PASSTHROUGH_PATH_PREFIXES,
};

async function match_cached(key: string): Promise<Option<Response>> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(key);
  return cached ? create_some_option(cached) : create_none_option();
}

async function store_in_cache(
  key: string,
  response: Response,
): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(key, response);
    return true;
  } catch (error) {
    console.warn("[ServiceWorker] Response could not be saved offline", {
      event: SERVICE_WORKER_EVENT.CACHE_WRITE_FAILED,
      error: String(error),
    });
    return false;
  }
}

async function fetch_from_network(request: Request): AsyncResult<Response> {
  try {
    return create_success_result(await fetch(request));
  } catch (error) {
    console.warn("[ServiceWorker] Network request failed", {
      event: SERVICE_WORKER_EVENT.NETWORK_FAILED,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

const strategy_ports: ServiceWorkerStrategyPorts = {
  match_cached,
  store_in_cache,
  fetch_from_network,
  wait: (milliseconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
  network_timeout_ms: NETWORK_TIMEOUT_MS,
  shell_path: APP_SHELL_PATH,
};

async function precache_app_shell(cache: Cache): Promise<boolean> {
  try {
    await cache.add(APP_SHELL_PATH);
    return true;
  } catch (error) {
    console.warn("[ServiceWorker] App shell could not be saved offline", {
      event: SERVICE_WORKER_EVENT.SHELL_PRECACHE_FAILED,
      error: String(error),
    });
    return false;
  }
}

async function precache_build(): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(PRECACHED_PATHS);
  await precache_app_shell(cache);
  console.log("[ServiceWorker] App saved for offline use", {
    event: SERVICE_WORKER_EVENT.PRECACHED,
    file_count: PRECACHED_PATHS.length,
  });
  return true;
}

async function remove_stale_caches(): Promise<boolean> {
  const stale_cache_names = list_stale_service_worker_caches(
    await caches.keys(),
    CACHE_NAME,
  );
  await Promise.all(stale_cache_names.map((name) => caches.delete(name)));
  console.log("[ServiceWorker] Old offline copies removed", {
    event: SERVICE_WORKER_EVENT.STALE_CACHES_REMOVED,
    removed_count: stale_cache_names.length,
  });
  return true;
}

function respond_to_fetch(event: ServiceWorkerFetchEvent): boolean {
  const { request } = event;
  const strategy = classify_service_worker_request(request, routing_context);
  switch (strategy) {
    case SERVICE_WORKER_STRATEGY.PASS_THROUGH:
      return false;
    case SERVICE_WORKER_STRATEGY.CACHE_FIRST:
      event.respondWith(respond_cache_first(request, strategy_ports));
      return true;
    case SERVICE_WORKER_STRATEGY.NETWORK_FIRST:
      event.respondWith(respond_network_first(request, strategy_ports));
      return true;
    case SERVICE_WORKER_STRATEGY.NAVIGATION_WITH_SHELL_FALLBACK:
      event.respondWith(
        respond_navigation_with_shell_fallback(request, strategy_ports),
      );
      return true;
  }
}

worker_scope.addEventListener(
  "install",
  (event: ServiceWorkerExtendableEvent) => {
    event.waitUntil(precache_build());
  },
);

worker_scope.addEventListener(
  "activate",
  (event: ServiceWorkerExtendableEvent) => {
    event.waitUntil(remove_stale_caches());
  },
);

worker_scope.addEventListener("fetch", respond_to_fetch);
