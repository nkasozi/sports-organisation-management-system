import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth_store,
  create_profile,
  get_accessible_routes_for_role_mock,
  goto_mock,
  reset_auth_state,
  set_auth_state,
  set_denial_mock,
} = vi.hoisted(() => {
  type MockProfile = {
    id: string;
    display_name: string;
    email: string;
    role:
      | "super_admin"
      | "org_admin"
      | "officials_manager"
      | "team_manager"
      | "official"
      | "player"
      | "public_viewer";
    organization_id: string;
    organization_name: string;
    team_id: string;
    player_id?: string;
    official_id?: string;
  };

  type MockAuthState = {
    current_profile: MockProfile | null;
    is_initialized: boolean;
    current_token: null;
    available_profiles: never[];
    sidebar_menu_items: never[];
  };

  type MockAccessibleRoutesResult = {
    success: boolean;
    data: string[];
    error?: string;
  };

  const create_initial_auth_state = (): MockAuthState => ({
    current_profile: null,
    is_initialized: true,
    current_token: null,
    available_profiles: [],
    sidebar_menu_items: [],
  });

  let auth_state = create_initial_auth_state();
  const auth_subscribers = new Set<(value: MockAuthState) => void>();

  const publish_auth_state = (): void => {
    auth_subscribers.forEach((subscriber) => subscriber(auth_state));
  };

  const set_auth_state = (
    next_state: Partial<MockAuthState>,
  ): MockAuthState => {
    auth_state = { ...auth_state, ...next_state };
    publish_auth_state();
    return auth_state;
  };

  const reset_auth_state = (): MockAuthState => {
    auth_state = create_initial_auth_state();
    publish_auth_state();
    return auth_state;
  };

  const auth_store = {
    subscribe(subscriber: (value: MockAuthState) => void) {
      subscriber(auth_state);
      auth_subscribers.add(subscriber);
      return () => {
        auth_subscribers.delete(subscriber);
      };
    },
    initialize: vi.fn(async (): Promise<void> => {
      set_auth_state({ is_initialized: true });
    }),
  };

  const goto_mock = vi.fn();
  const set_denial_mock = vi.fn();
  const get_accessible_routes_for_role_mock = vi.fn(
    async (_role: string): Promise<MockAccessibleRoutesResult> => ({
      success: true,
      data: [],
    }),
  );

  const create_profile = (overrides: Partial<MockProfile> = {}): MockProfile => ({
    id: "profile-1",
    display_name: "Test User",
    email: "user@test.com",
    role: "player",
    organization_id: "org-1",
    organization_name: "Test Organisation",
    team_id: "team-1",
    ...overrides,
  });

  return {
    auth_store,
    create_profile,
    get_accessible_routes_for_role_mock,
    goto_mock,
    reset_auth_state,
    set_auth_state,
    set_denial_mock,
  };
});

vi.mock("$app/navigation", () => ({
  goto: goto_mock,
}));

vi.mock("../stores/auth", () => ({
  auth_store,
}));

vi.mock("../stores/accessDenial", () => ({
  access_denial_store: {
    set_denial: set_denial_mock,
  },
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({
    get_accessible_routes_for_role: get_accessible_routes_for_role_mock,
  }),
}));

import {
  check_route_access,
  ensure_auth_profile,
  ensure_route_access,
  extract_route_base,
  format_route_as_page_name,
  get_current_auth_profile,
  invalidate_route_access_cache,
  is_auth_initialized,
  is_route_in_accessible_set,
} from "./authGuard";

describe("authGuard", () => {
  beforeEach(() => {
    goto_mock.mockReset();
    set_denial_mock.mockReset();
    get_accessible_routes_for_role_mock.mockReset();
    get_accessible_routes_for_role_mock.mockResolvedValue({
      success: true,
      data: [],
    });
    auth_store.initialize.mockReset();
    auth_store.initialize.mockImplementation(async (): Promise<void> => {
      set_auth_state({ is_initialized: true });
    });
    reset_auth_state();
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
        current_profile: create_profile({ role: "super_admin" }),
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
        current_profile: create_profile({ role: "team_manager" }),
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
        current_profile: create_profile({ role: "player" }),
      });

      const result = await check_route_access("/system-users");

      expect(result.allowed).toBe(false);
      expect(result.message).toContain("Player");
      expect(result.message).toContain("System Users");
    });

    it("caches accessible routes for repeated checks with the same role", async () => {
      set_auth_state({
        current_profile: create_profile({ role: "org_admin" }),
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
        async (role: string): Promise<{
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
        current_profile: create_profile({ role: "super_admin" }),
      });
      const admin_result = await check_route_access("/system-users");

      set_auth_state({
        current_profile: create_profile({ role: "player", id: "profile-2" }),
      });
      const player_result = await check_route_access("/system-users");

      expect(admin_result.allowed).toBe(true);
      expect(player_result.allowed).toBe(false);
      expect(get_accessible_routes_for_role_mock).toHaveBeenCalledTimes(2);
    });

    it("denies access when route loading fails", async () => {
      set_auth_state({
        current_profile: create_profile({ role: "official" }),
      });
      get_accessible_routes_for_role_mock.mockResolvedValue({
        success: false,
        data: [],
        error: "boom",
      });

      const result = await check_route_access("/fixtures");

      expect(result.allowed).toBe(false);
    });
  });

  describe("ensure_route_access", () => {
    it("stores the denial and redirects when access is denied", async () => {
      set_auth_state({
        current_profile: create_profile({ role: "player" }),
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
        current_profile: create_profile({ role: "super_admin" }),
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

  describe("ensure_auth_profile", () => {
    it("initializes auth and returns the active profile", async () => {
      const profile = create_profile({ role: "org_admin" });
      set_auth_state({ is_initialized: false });
      auth_store.initialize.mockImplementation(async (): Promise<void> => {
        set_auth_state({ is_initialized: true, current_profile: profile });
      });

      const result = await ensure_auth_profile();

      expect(result).toEqual({
        success: true,
        profile,
        error_message: "",
      });
    });

    it("returns a failure result when no profile exists after initialization", async () => {
      set_auth_state({ is_initialized: false, current_profile: null });

      const result = await ensure_auth_profile();

      expect(result.success).toBe(false);
      expect(result.profile).toBeNull();
      expect(result.error_message).toContain("No user profile");
    });
  });

  describe("auth state helpers", () => {
    it("returns the current profile", () => {
      const profile = create_profile({ role: "officials_manager" });
      set_auth_state({ current_profile: profile });

      expect(get_current_auth_profile()).toEqual(profile);
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
      expect(is_route_in_accessible_set("/match-report/fixture-1", routes)).toBe(
        true,
      );
    });

    it("matches both exact routes and nested routes by base", () => {
      const routes = new Set<string>(["/teams", "/players"]);

      expect(is_route_in_accessible_set("/teams", routes)).toBe(true);
      expect(is_route_in_accessible_set("/teams/123", routes)).toBe(true);
      expect(is_route_in_accessible_set("/settings", routes)).toBe(false);
    });
  });

  describe("route access cache", () => {
    it("reports whether a cache entry existed", async () => {
      expect(invalidate_route_access_cache()).toBe(false);

      set_auth_state({
        current_profile: create_profile({ role: "super_admin" }),
      });
      get_accessible_routes_for_role_mock.mockResolvedValue({
        success: true,
        data: ["/teams"],
      });

      await check_route_access("/teams");

      expect(invalidate_route_access_cache()).toBe(true);
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
