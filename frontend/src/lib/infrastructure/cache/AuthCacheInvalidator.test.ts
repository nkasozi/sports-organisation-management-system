import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  create_auth_cache_invalidator,
  type AuthCacheInvalidatorConfig,
  type SubscribableConvexClient,
} from "./AuthCacheInvalidator";
import type { AuthCache } from "./AuthCache";
import { create_auth_cache } from "./AuthCache";

function create_mock_convex_client(): SubscribableConvexClient & {
  trigger_subscription: (query_name: string, new_data: unknown) => void;
  registered_subscriptions: Map<string, (result: unknown) => void>;
} {
  const registered_subscriptions = new Map<string, (result: unknown) => void>();

  return {
    registered_subscriptions,
    onUpdate: vi.fn(
      (
        query_reference: unknown,
        _args: Record<string, unknown>,
        callback: (result: unknown) => void,
      ) => {
        const query_name = String(query_reference);
        registered_subscriptions.set(query_name, callback);
        return { unsubscribe: vi.fn() };
      },
    ),
    trigger_subscription(query_name: string, new_data: unknown): void {
      const callback = registered_subscriptions.get(query_name);
      if (callback) callback(new_data);
    },
  };
}

function create_test_cache(): AuthCache<string> {
  return create_auth_cache<string>({
    max_entries: 100,
    fallback_ttl_ms: 30 * 60 * 1000,
  });
}

describe("AuthCacheInvalidator", () => {
  let mock_client: ReturnType<typeof create_mock_convex_client>;
  let auth_cache: AuthCache<string>;
  let authz_cache: AuthCache<string>;

  beforeEach(() => {
    mock_client = create_mock_convex_client();
    auth_cache = create_test_cache();
    authz_cache = create_test_cache();
  });

  describe("start", () => {
    it("should subscribe to auth-related convex queries", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache, authz_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });

      const start_result = invalidator.start();

      expect(start_result).toBe(true);
      expect(mock_client.onUpdate).toHaveBeenCalled();
    });

    it("should return false if already started", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });

      invalidator.start();
      const second_start_result = invalidator.start();

      expect(second_start_result).toBe(false);
    });
  });

  describe("cache invalidation on subscription change", () => {
    it("should clear all registered caches when user profile changes", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache, authz_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });
      invalidator.start();

      const user_profile_query = Array.from(
        mock_client.registered_subscriptions.keys(),
      ).find((key) => key.includes("user_profile"));

      if (user_profile_query) {
        mock_client.trigger_subscription(user_profile_query, {
          role: "super_admin",
        });
      }

      auth_cache.set("token-1", "verified-user");
      authz_cache.set("perm-1", "allowed");

      if (user_profile_query) {
        mock_client.trigger_subscription(user_profile_query, {
          role: "org_admin",
        });
      }

      expect(auth_cache.get_or_miss("token-1").is_hit).toBe(false);
      expect(authz_cache.get_or_miss("perm-1").is_hit).toBe(false);
    });
  });

  describe("stop", () => {
    it("should unsubscribe from all convex queries", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });
      invalidator.start();

      const stop_result = invalidator.stop();

      expect(stop_result).toBe(true);
    });

    it("should return false if not currently running", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });

      const stop_result = invalidator.stop();

      expect(stop_result).toBe(false);
    });

    it("should allow restarting after stop", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });

      invalidator.start();
      invalidator.stop();
      const restart_result = invalidator.start();

      expect(restart_result).toBe(true);
    });
  });

  describe("is_running", () => {
    it("should return false before start", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });

      expect(invalidator.is_running()).toBe(false);
    });

    it("should return true after start", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });

      invalidator.start();

      expect(invalidator.is_running()).toBe(true);
    });

    it("should return false after stop", () => {
      const invalidator = create_auth_cache_invalidator({
        convex_client: mock_client,
        caches_to_invalidate: [auth_cache],
        queries_to_watch: ["authorization:get_current_user_profile"],
      });

      invalidator.start();
      invalidator.stop();

      expect(invalidator.is_running()).toBe(false);
    });
  });
});
