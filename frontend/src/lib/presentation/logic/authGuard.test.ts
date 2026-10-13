import { beforeEach, describe, expect, it, vi } from "vitest";

import { check_route_access, invalidate_route_access_cache } from "./authGuard";
import {
  auth_store,
  create_present_profile_state,
  create_profile,
  get_accessible_routes_for_role_mock,
  reset_auth_guard_mocks,
  set_auth_state,
} from "./authGuard.test_support";
import { AUTH_GUARD_MESSAGES } from "./authGuardConstants";

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
    it("initializes auth when auth state is not initialized", async () => {
      set_auth_state({ is_initialized: false });

      const result = await check_route_access("/calendar");

      expect(auth_store.initialize).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ allowed: true, message: "" });
    });

    it("allows public routes when there is no profile", async () => {
      const result = await check_route_access("/match-report/fixture-1");

      expect(result).toEqual({ allowed: true, message: "" });
      expect(get_accessible_routes_for_role_mock).not.toHaveBeenCalled();
    });

    it("denies protected routes when there is no profile", async () => {
      const result = await check_route_access("/settings");

      expect(result.allowed).toBe(false);
      expect(result.message).toContain("select a user profile");
    });

    it("allows a route when the exact path is accessible", async () => {
      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "super_admin" }),
        ),
      });
      get_accessible_routes_for_role_mock.mockResolvedValue({
        success: true,
        data: ["/system-users"],
      });

      const result = await check_route_access("/system-users");

      expect(result).toEqual({ allowed: true, message: "" });
    });

    it("allows a nested route when the base route is accessible", async () => {
      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "team_manager" }),
        ),
      });
      get_accessible_routes_for_role_mock.mockResolvedValue({
        success: true,
        data: ["/teams"],
      });

      const result = await check_route_access("/teams/abc-123");

      expect(result).toEqual({ allowed: true, message: "" });
    });

    it("denies inaccessible routes with a role-specific message", async () => {
      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "player" }),
        ),
      });

      const result = await check_route_access("/system-users");

      expect(result.allowed).toBe(false);
      expect(result.message).toContain("Player");
      expect(result.message).toContain("System Users");
    });

    it("denies access when route loading fails", async () => {
      set_auth_state({
        current_profile: create_present_profile_state(
          create_profile({ role: "official" }),
        ),
      });
      get_accessible_routes_for_role_mock.mockResolvedValue({
        success: false,
        data: [],
        error: "boom",
      });

      const result = await check_route_access("/fixtures");

      expect(result).toEqual({
        allowed: false,
        message: AUTH_GUARD_MESSAGES.ROUTE_ACCESS_UNAVAILABLE,
      });
    });

    it("returns a session message when auth initialization fails", async () => {
      set_auth_state({ is_initialized: false });
      auth_store.initialize.mockResolvedValueOnce({
        success: false,
        error: "storage unavailable",
      } as never);

      const protected_result = await check_route_access("/teams");
      const public_result = await check_route_access("/calendar");

      expect(protected_result).toEqual({
        allowed: false,
        message: AUTH_GUARD_MESSAGES.SESSION_UNAVAILABLE,
      });
      expect(public_result.allowed).toBe(true);
    });
  });
});
