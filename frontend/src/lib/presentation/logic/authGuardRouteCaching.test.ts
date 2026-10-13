import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  check_route_access,
  ensure_route_access,
  invalidate_route_access_cache,
} from "./authGuard";
import {
  create_present_profile_state,
  create_profile,
  get_accessible_routes_for_role_mock,
  goto_mock,
  reset_auth_guard_mocks,
  set_auth_state,
  set_denial_mock,
} from "./authGuard.test_support";

vi.mock("$app/navigation", async () => ({
  goto: (await import("./authGuard.test_support")).goto_mock,
}));

vi.mock("../stores/auth", async () => ({
  auth_store: (await import("./authGuard.test_support")).auth_store,
}));

vi.mock("../stores/accessDenial", async () => ({
  access_denial_store: {
    set_denial: (await import("./authGuard.test_support")).set_denial_mock,
  },
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", async () => {
  const support = await import("./authGuard.test_support");
  return {
    get_authorization_adapter: () => ({
      get_accessible_routes_for_role:
        support.get_accessible_routes_for_role_mock,
    }),
  };
});

describe("authGuard", () => {
  beforeEach(() => {
    reset_auth_guard_mocks();
    invalidate_route_access_cache();
  });

  describe("check_route_access", () => {
    it("caches accessible routes for repeated checks with the same role", async () => {
      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "org_admin" }),
        ),
      });
      get_accessible_routes_for_role_mock.mockResolvedValue({
        success: true,
        data: ["/settings", "/venues"],
      });

      await check_route_access("/settings");
      await check_route_access("/venues");

      expect(get_accessible_routes_for_role_mock).toHaveBeenCalledTimes(1);
    });

    it("reloads cached routes when the role changes", async () => {
      get_accessible_routes_for_role_mock.mockImplementation(
        async (
          role: string,
        ): Promise<{
          success: boolean;
          data: string[];
          error?: string;
        }> => ({
          success: true,
          data:
            role === "super_admin"
              ? ["/system-users"]
              : role === "player"
                ? ["/players"]
                : [],
        }),
      );

      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "super_admin" }),
        ),
      });
      const admin_result = await check_route_access("/system-users");

      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "player", id: "profile-2" }),
        ),
      });
      const player_result = await check_route_access("/system-users");

      expect(admin_result.allowed).toBe(true);
      expect(player_result.allowed).toBe(false);
      expect(get_accessible_routes_for_role_mock).toHaveBeenCalledTimes(2);
    });
  });

  describe("ensure_route_access", () => {
    it("stores the denial and redirects when access is denied", async () => {
      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "player" }),
        ),
      });

      const result = await ensure_route_access("/settings");

      expect(result).toBe(false);
      expect(set_denial_mock).toHaveBeenCalledWith(
        "/settings",
        expect.stringContaining("Player"),
      );
      expect(goto_mock).toHaveBeenCalledWith("/");
    });

    it("returns true and does not redirect when access is allowed", async () => {
      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "super_admin" }),
        ),
      });
      get_accessible_routes_for_role_mock.mockResolvedValue({
        success: true,
        data: ["/system-users"],
      });

      const result = await ensure_route_access("/system-users");

      expect(result).toBe(true);
      expect(set_denial_mock).not.toHaveBeenCalled();
      expect(goto_mock).not.toHaveBeenCalled();
    });
  });

  describe("route access cache", () => {
    it("reports whether a cache entry existed", async () => {
      expect(invalidate_route_access_cache()).toBe(false);

      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "super_admin" }),
        ),
      });
      get_accessible_routes_for_role_mock.mockResolvedValue({
        success: true,
        data: ["/teams"],
      });

      await check_route_access("/teams");

      expect(invalidate_route_access_cache()).toBe(true);
    });
  });
});
