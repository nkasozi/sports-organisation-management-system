import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  create_auth_cache,
  type AuthCache,
  type AuthCacheConfig,
} from "./AuthCache";

function create_default_cache<T>(
  config_overrides?: Partial<AuthCacheConfig>,
): AuthCache<T> {
  return create_auth_cache<T>({
    max_entries: 100,
    fallback_ttl_ms: 30 * 60 * 1000,
    ...config_overrides,
  });
}

describe("AuthCache", () => {
  let cache: AuthCache<string>;

  beforeEach(() => {
    cache = create_default_cache<string>();
  });

  describe("get_or_miss", () => {
    it("should return cache miss for key that was never set", () => {
      const result = cache.get_or_miss("nonexistent");

      expect(result.is_hit).toBe(false);
      expect(result.value).toBeUndefined();
    });

    it("should return cache hit with correct value after set", () => {
      cache.set("my-key", "my-value");

      const result = cache.get_or_miss("my-key");

      expect(result.is_hit).toBe(true);
      expect(result.value).toBe("my-value");
    });

    it("should return different values for different keys", () => {
      cache.set("key-a", "value-a");
      cache.set("key-b", "value-b");

      expect(cache.get_or_miss("key-a").value).toBe("value-a");
      expect(cache.get_or_miss("key-b").value).toBe("value-b");
    });

    it("should return cache miss for expired entries", async () => {
      const short_ttl_cache = create_default_cache<string>({
        fallback_ttl_ms: 10,
      });
      short_ttl_cache.set("expiring-key", "will-expire");

      await new Promise((resolve) => setTimeout(resolve, 20));

      const result = short_ttl_cache.get_or_miss("expiring-key");

      expect(result.is_hit).toBe(false);
    });
  });

  describe("set", () => {
    it("should overwrite existing value for same key", () => {
      cache.set("key", "original");
      cache.set("key", "updated");

      const result = cache.get_or_miss("key");

      expect(result.value).toBe("updated");
    });

    it("should evict oldest entry when max_entries exceeded", () => {
      const tiny_cache = create_default_cache<string>({ max_entries: 2 });

      tiny_cache.set("first", "1");
      tiny_cache.set("second", "2");
      tiny_cache.set("third", "3");

      expect(tiny_cache.get_or_miss("first").is_hit).toBe(false);
      expect(tiny_cache.get_or_miss("second").is_hit).toBe(true);
      expect(tiny_cache.get_or_miss("third").is_hit).toBe(true);
    });

    it("should return true on successful set", () => {
      const result = cache.set("key", "value");

      expect(result).toBe(true);
    });
  });

  describe("invalidate", () => {
    it("should remove a specific cached entry", () => {
      cache.set("target", "to-remove");
      cache.set("keep", "stays");

      const removed = cache.invalidate("target");

      expect(removed).toBe(true);
      expect(cache.get_or_miss("target").is_hit).toBe(false);
      expect(cache.get_or_miss("keep").is_hit).toBe(true);
    });

    it("should return false when invalidating non-existent key", () => {
      const removed = cache.invalidate("ghost");

      expect(removed).toBe(false);
    });
  });

  describe("invalidate_all", () => {
    it("should clear all cached entries", () => {
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      const cleared_count = cache.invalidate_all();

      expect(cleared_count).toBe(3);
      expect(cache.get_or_miss("a").is_hit).toBe(false);
      expect(cache.get_or_miss("b").is_hit).toBe(false);
      expect(cache.get_or_miss("c").is_hit).toBe(false);
    });

    it("should return zero when cache is already empty", () => {
      const cleared_count = cache.invalidate_all();

      expect(cleared_count).toBe(0);
    });
  });

  describe("get_stats", () => {
    it("should track hit and miss counts", () => {
      cache.set("existing", "value");

      cache.get_or_miss("existing");
      cache.get_or_miss("existing");
      cache.get_or_miss("nonexistent");

      const stats = cache.get_stats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.entry_count).toBe(1);
    });

    it("should reset stats after invalidate_all", () => {
      cache.set("key", "value");
      cache.get_or_miss("key");

      cache.invalidate_all();
      const stats = cache.get_stats();

      expect(stats.entry_count).toBe(0);
    });
  });

  describe("complex value types", () => {
    it("should cache objects correctly", () => {
      const object_cache = create_default_cache<{ role: string; id: number }>();

      object_cache.set("user-1", { role: "admin", id: 1 });

      const result = object_cache.get_or_miss("user-1");

      expect(result.is_hit).toBe(true);
      expect(result.value?.role).toBe("admin");
      expect(result.value?.id).toBe(1);
    });
  });
});
