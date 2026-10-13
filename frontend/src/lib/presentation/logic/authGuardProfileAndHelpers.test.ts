import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensure_auth_profile,
  extract_route_base,
  format_route_as_page_name,
  get_current_auth_profile_state,
  invalidate_route_access_cache,
  is_auth_initialized,
  is_route_in_accessible_set,
} from "./authGuard";
import {
  auth_store,
  create_present_profile_state,
  create_profile,
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

  describe("ensure_auth_profile", () => {
    it("initializes auth and returns the active profile", async () => {
      const profile = create_profile({ role: "org_admin" });
      set_auth_state({ is_initialized: false });
      auth_store.initialize.mockImplementation(
        async (): Promise<{ success: true; data: true }> => {
          set_auth_state({
            is_initialized: true,
            current_profile: create_present_profile_state(profile),
          });
          return { success: true, data: true };
        },
      );

      const result = await ensure_auth_profile();

      expect(result).toEqual({
        success: true,
        profile_state: { status: "present", profile },
        error_message: "",
      });
    });

    it("returns a failure result when no profile exists after initialization", async () => {
      set_auth_state({
        is_initialized: false,
        current_profile: { status: "missing" },
      });

      const result = await ensure_auth_profile();

      expect(result.success).toBe(false);
      expect(result.profile_state).toEqual({ status: "missing" });
      expect(result.error_message).toContain("No user profile");
    });

    it("returns a session failure when auth initialization fails", async () => {
      set_auth_state({ is_initialized: false });
      auth_store.initialize.mockResolvedValueOnce({
        success: false,
        error: "storage unavailable",
      } as never);

      const result = await ensure_auth_profile();

      expect(result).toEqual({
        success: false,
        profile_state: { status: "missing" },
        error_message: AUTH_GUARD_MESSAGES.SESSION_UNAVAILABLE,
      });
    });
  });

  describe("auth state helpers", () => {
    it("returns the current profile state", () => {
      const profile = create_profile({ role: "officials_manager" });
      set_auth_state({
        current_profile: create_present_profile_state(profile),
      });

      expect(get_current_auth_profile_state()).toEqual({
        status: "present",
        profile,
      });
    });

    it("returns whether auth is initialized", () => {
      set_auth_state({ is_initialized: false });
      expect(is_auth_initialized()).toBe(false);

      set_auth_state({ is_initialized: true });
      expect(is_auth_initialized()).toBe(true);
    });
  });

  describe("extract_route_base", () => {
    it("returns / for empty and root paths", () => {
      expect(extract_route_base("")).toBe("/");
      expect(extract_route_base("/")).toBe("/");
    });

    it("returns the first route segment", () => {
      expect(extract_route_base("/teams/123")).toBe("/teams");
      expect(extract_route_base("/competitions/create")).toBe("/competitions");
    });
  });

  describe("is_route_in_accessible_set", () => {
    it("accepts root and always-allowed paths", () => {
      const routes = new Set<string>();

      expect(is_route_in_accessible_set("/", routes)).toBe(true);
      expect(is_route_in_accessible_set("/calendar", routes)).toBe(true);
      expect(
        is_route_in_accessible_set("/match-report/fixture-1", routes),
      ).toBe(true);
    });

    it("matches both exact routes and nested routes by base", () => {
      const routes = new Set<string>(["/teams", "/players"]);

      expect(is_route_in_accessible_set("/teams", routes)).toBe(true);
      expect(is_route_in_accessible_set("/teams/123", routes)).toBe(true);
      expect(is_route_in_accessible_set("/settings", routes)).toBe(false);
    });
  });

  describe("format_route_as_page_name", () => {
    it("formats root paths as Dashboard", () => {
      expect(format_route_as_page_name("/")).toBe("Dashboard");
      expect(format_route_as_page_name("")).toBe("Dashboard");
    });

    it("formats route slugs as title case", () => {
      expect(format_route_as_page_name("/teams")).toBe("Teams");
      expect(format_route_as_page_name("/system-users")).toBe("System Users");
      expect(format_route_as_page_name("/player-team-memberships")).toBe(
        "Player Team Memberships",
      );
      expect(format_route_as_page_name("/fixtures/fixture-1")).toBe("Fixtures");
    });
  });
});
