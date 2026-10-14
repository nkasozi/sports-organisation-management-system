import { describe, expect, it } from "vitest";

import {
  build_service_worker_cache_name,
  classify_service_worker_request,
  list_stale_service_worker_caches,
  SERVICE_WORKER_STRATEGY,
  type ServiceWorkerRoutingContext,
} from "./serviceWorkerRouting";

const APP_ORIGIN = "https://app.sportsync.example";

const routing_context: ServiceWorkerRoutingContext = {
  app_origin: APP_ORIGIN,
  precached_paths: new Set([
    "/_app/immutable/entry/start.abc.js",
    "/_app/immutable/nodes/2.def.js",
    "/favicon.svg",
    "/theme-init.js",
  ]),
  passthrough_path_prefixes: ["/__clerk", "/api/"],
};

function describe_request(
  url: string,
  overrides: Partial<{ method: string; mode: string }> = {},
): { url: string; method: string; mode: string } {
  return { url, method: "GET", mode: "cors", ...overrides };
}

describe("classify_service_worker_request", () => {
  it("never intercepts cross-origin Clerk or Convex requests", () => {
    expect(
      classify_service_worker_request(
        describe_request("https://clerk.sportsync.example/v1/client"),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.PASS_THROUGH);
    expect(
      classify_service_worker_request(
        describe_request("https://happy-otter-123.convex.cloud/api/query"),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.PASS_THROUGH);
  });

  it("never intercepts non-GET requests", () => {
    expect(
      classify_service_worker_request(
        describe_request(`${APP_ORIGIN}/favicon.svg`, { method: "POST" }),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.PASS_THROUGH);
  });

  it("never intercepts the same-origin Clerk proxy or API routes", () => {
    expect(
      classify_service_worker_request(
        describe_request(`${APP_ORIGIN}/__clerk/v1/client`),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.PASS_THROUGH);
    expect(
      classify_service_worker_request(
        describe_request(`${APP_ORIGIN}/api/health`, { mode: "navigate" }),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.PASS_THROUGH);
  });

  it("serves precached build chunks and static files cache-first", () => {
    expect(
      classify_service_worker_request(
        describe_request(`${APP_ORIGIN}/_app/immutable/nodes/2.def.js`),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.CACHE_FIRST);
    expect(
      classify_service_worker_request(
        describe_request(`${APP_ORIGIN}/theme-init.js`),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.CACHE_FIRST);
  });

  it("serves unknown immutable chunks cache-first", () => {
    expect(
      classify_service_worker_request(
        describe_request(`${APP_ORIGIN}/_app/immutable/chunks/late.js`),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.CACHE_FIRST);
  });

  it("falls back to the app shell for navigations", () => {
    expect(
      classify_service_worker_request(
        describe_request(`${APP_ORIGIN}/fixtures/abc`, { mode: "navigate" }),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.NAVIGATION_WITH_SHELL_FALLBACK);
  });

  it("uses a bounded network-first strategy for other same-origin reads", () => {
    expect(
      classify_service_worker_request(
        describe_request(`${APP_ORIGIN}/_app/version.json`),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.NETWORK_FIRST);
  });

  it("passes through malformed request urls", () => {
    expect(
      classify_service_worker_request(
        describe_request("not a url"),
        routing_context,
      ),
    ).toBe(SERVICE_WORKER_STRATEGY.PASS_THROUGH);
  });
});

describe("service worker cache versioning", () => {
  it("names the cache after the build version", () => {
    expect(build_service_worker_cache_name("1700000000")).toBe(
      "sport-sync-app-1700000000",
    );
  });

  it("lists older app caches as stale and keeps foreign caches", () => {
    expect(
      list_stale_service_worker_caches(
        [
          "sport-sync-app-old",
          "sport-sync-app-new",
          "sports-org-static-v3",
          "sports-org-dynamic-v3",
          "third-party-cache",
        ],
        "sport-sync-app-new",
      ),
    ).toEqual([
      "sport-sync-app-old",
      "sports-org-static-v3",
      "sports-org-dynamic-v3",
    ]);
  });
});
