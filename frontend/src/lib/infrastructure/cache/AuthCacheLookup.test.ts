import { afterEach, describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { create_auth_cache } from "./AuthCache";
import {
  AUTH_CACHE_EVENT,
  CACHE_LOOKUP_STATUS,
  CACHE_MISS_REASON,
  CACHE_STORE_OUTCOME,
} from "./authCacheConstants";

function create_cache(
  ttl_ms = 1000,
): ReturnType<typeof create_auth_cache<string[]>> {
  return create_auth_cache<string[]>({
    max_entries: 10,
    fallback_ttl_ms: ttl_ms,
  });
}

describe("AuthCache lookup", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reports an absent miss for an unknown key", () => {
    expect(create_cache().lookup("missing")).toEqual({
      status: CACHE_LOOKUP_STATUS.MISS,
      reason: CACHE_MISS_REASON.ABSENT,
    });
  });

  it("reports a hit with the stored value", () => {
    const cache = create_cache();
    cache.set("key", ["read"]);
    expect(cache.lookup("key")).toEqual({
      status: CACHE_LOOKUP_STATUS.HIT,
      value: ["read"],
    });
  });

  it("reports an expired miss after the ttl elapses", () => {
    vi.useFakeTimers();
    const cache = create_cache(100);
    cache.set("key", ["read"]);
    vi.advanceTimersByTime(100);
    expect(cache.lookup("key")).toEqual({
      status: CACHE_LOOKUP_STATUS.MISS,
      reason: CACHE_MISS_REASON.EXPIRED,
    });
    expect(cache.get_stats().entry_count).toBe(0);
  });
});

describe("AuthCache store_successful_result", () => {
  it("stores the data of a successful result", () => {
    const cache = create_cache();
    const outcome = cache.store_successful_result(
      "key",
      create_success_result(["read"]),
    );
    expect(outcome).toBe(CACHE_STORE_OUTCOME.STORED);
    expect(cache.lookup("key")).toEqual({
      status: CACHE_LOOKUP_STATUS.HIT,
      value: ["read"],
    });
  });

  it("never caches a failure result", () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cache = create_cache();
    const outcome = cache.store_successful_result(
      "key",
      create_failure_result("Failed to load permissions"),
    );
    expect(outcome).toBe(CACHE_STORE_OUTCOME.REJECTED_FAILURE);
    expect(cache.lookup("key").status).toBe(CACHE_LOOKUP_STATUS.MISS);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: AUTH_CACHE_EVENT.FAILURE_NOT_CACHED }),
    );
  });
});
