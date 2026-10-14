import { describe, expect, it, vi } from "vitest";

import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  respond_cache_first,
  respond_navigation_with_shell_fallback,
  respond_network_first,
  type ServiceWorkerStrategyPorts,
} from "./serviceWorkerStrategies";

const PAGE_URL = "https://app.example/fixtures";
const SHELL_PATH = "/";

function build_ports(
  overrides: Partial<ServiceWorkerStrategyPorts> = {},
): ServiceWorkerStrategyPorts & {
  stored: Map<string, Response>;
} {
  const stored = new Map<string, Response>();
  return {
    stored,
    match_cached: vi.fn(
      async (key: string): Promise<Option<Response>> =>
        stored.has(key)
          ? create_some_option(stored.get(key) as Response)
          : create_none_option(),
    ),
    store_in_cache: vi.fn(async (key: string, response: Response) => {
      stored.set(key, response);
      return true;
    }),
    fetch_from_network: vi.fn(async () =>
      create_success_result(new Response("network")),
    ),
    wait: vi.fn(() => new Promise<void>(() => {})),
    network_timeout_ms: 3000,
    shell_path: SHELL_PATH,
    ...overrides,
  };
}

describe("respond_cache_first", () => {
  it("returns the cached response without touching the network", async () => {
    const ports = build_ports();
    ports.stored.set(PAGE_URL, new Response("cached"));
    const response = await respond_cache_first(new Request(PAGE_URL), ports);
    expect(await response.text()).toBe("cached");
    expect(ports.fetch_from_network).not.toHaveBeenCalled();
  });

  it("fetches and caches a missing asset", async () => {
    const ports = build_ports();
    const response = await respond_cache_first(new Request(PAGE_URL), ports);
    expect(await response.text()).toBe("network");
    expect(ports.store_in_cache).toHaveBeenCalled();
  });

  it("returns an offline response when nothing is available", async () => {
    const ports = build_ports({
      fetch_from_network: vi.fn(async () => create_failure_result("offline")),
    });
    const response = await respond_cache_first(new Request(PAGE_URL), ports);
    expect(response.status).toBe(503);
  });
});

describe("respond_network_first", () => {
  it("returns and caches a fresh network response", async () => {
    const ports = build_ports();
    const response = await respond_network_first(new Request(PAGE_URL), ports);
    expect(await response.text()).toBe("network");
    expect(ports.stored.has(PAGE_URL)).toBe(true);
  });

  it("serves the cached copy when the network hangs past the timeout", async () => {
    const ports = build_ports({
      fetch_from_network: vi.fn(() => new Promise<never>(() => {})),
      wait: vi.fn(async () => {}),
    });
    ports.stored.set(PAGE_URL, new Response("cached"));
    const response = await respond_network_first(new Request(PAGE_URL), ports);
    expect(await response.text()).toBe("cached");
    expect(ports.wait).toHaveBeenCalledWith(3000);
  });

  it("does not cache failed network responses", async () => {
    const ports = build_ports({
      fetch_from_network: vi.fn(async () =>
        create_success_result(new Response("missing", { status: 404 })),
      ),
    });
    const response = await respond_network_first(new Request(PAGE_URL), ports);
    expect(response.status).toBe(404);
    expect(ports.store_in_cache).not.toHaveBeenCalled();
  });
});

describe("respond_navigation_with_shell_fallback", () => {
  it("serves the cached app shell when offline and the page was never visited", async () => {
    const ports = build_ports({
      fetch_from_network: vi.fn(async () => create_failure_result("offline")),
    });
    ports.stored.set(SHELL_PATH, new Response("shell"));
    const response = await respond_navigation_with_shell_fallback(
      new Request(PAGE_URL),
      ports,
    );
    expect(await response.text()).toBe("shell");
  });

  it("returns an offline page when even the shell is missing", async () => {
    const ports = build_ports({
      fetch_from_network: vi.fn(async () => create_failure_result("offline")),
    });
    const response = await respond_navigation_with_shell_fallback(
      new Request(PAGE_URL),
      ports,
    );
    expect(response.status).toBe(503);
  });
});
