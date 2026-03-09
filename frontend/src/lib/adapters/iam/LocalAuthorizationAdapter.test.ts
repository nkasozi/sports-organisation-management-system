import { describe, it, expect, vi } from "vitest";
import {
  LocalAuthorizationAdapter,
  get_sidebar_menu_for_role,
  can_role_access_route,
  get_allowed_routes_for_role,
} from "./LocalAuthorizationAdapter";
import type { UserRole } from "$lib/core/interfaces/ports";
import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";
import type { AuthenticationPort } from "$lib/core/interfaces/ports";

function create_mock_auth_port(
  role: UserRole,
  is_valid: boolean = true,
  error_message?: string,
): AuthenticationPort {
  return {
    generate_token: vi.fn(),
    verify_token: vi.fn().mockResolvedValue({
      success: true,
      data: {
        is_valid,
        payload: is_valid
          ? {
              user_id: `test-${role}-123`,
              email: `${role}@test.com`,
              display_name: `Test ${role}`,
              role,
              organization_id: "org-1",
              team_id: "team-1",
              issued_at: Date.now(),
              expires_at: Date.now() + 365 * 24 * 60 * 60 * 1000,
            }
          : null,
        error_message,
      },
    }),
    decode_token_payload: vi.fn(),
  } as unknown as AuthenticationPort;
}

describe("LocalAuthorizationAdapter", () => {
  describe("get_profile_permissions", () => {
    it("should return full permissions for super_admin", async () => {
      const mock_auth = create_mock_auth_port("super_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.get_profile_permissions("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("super_admin");
        expect(result.data.permissions.root_level.create).toBe(true);
        expect(result.data.permissions.root_level.read).toBe(true);
        expect(result.data.permissions.root_level.update).toBe(true);
        expect(result.data.permissions.root_level.delete).toBe(true);
        expect(result.data.permissions.org_administrator_level.create).toBe(
          true,
        );
        expect(result.data.permissions.organisation_level.create).toBe(true);
        expect(result.data.permissions.team_level.create).toBe(true);
        expect(result.data.permissions.player_level.create).toBe(true);
      }
    });

    it("should return read-only root permissions for org_admin", async () => {
      const mock_auth = create_mock_auth_port("org_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.get_profile_permissions("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("org_admin");
        expect(result.data.permissions.root_level.create).toBe(false);
        expect(result.data.permissions.root_level.read).toBe(true);
        expect(result.data.permissions.root_level.update).toBe(false);
        expect(result.data.permissions.org_administrator_level.create).toBe(
          true,
        );
        expect(result.data.permissions.organisation_level.create).toBe(true);
      }
    });

    it("should return limited permissions for player", async () => {
      const mock_auth = create_mock_auth_port("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.get_profile_permissions("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("player");
        expect(result.data.permissions.root_level.create).toBe(false);
        expect(result.data.permissions.org_administrator_level.create).toBe(
          false,
        );
        expect(result.data.permissions.player_level.create).toBe(false);
        expect(result.data.permissions.player_level.read).toBe(true);
        expect(result.data.permissions.player_level.update).toBe(true);
        expect(result.data.permissions.player_level.delete).toBe(false);
        expect(result.data.permissions.public_level.create).toBe(true);
        expect(result.data.permissions.public_level.read).toBe(true);
        expect(result.data.permissions.public_level.update).toBe(true);
        expect(result.data.permissions.public_level.delete).toBe(true);
      }
    });

    it("should return failure for invalid token", async () => {
      const mock_auth = create_mock_auth_port(
        "player",
        false,
        "Token is invalid",
      );
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.get_profile_permissions("invalid-token");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.failure_type).toBe("token_invalid");
        expect(result.error.message).toContain("Token");
      }
    });

    it("should return token_expired failure for expired token", async () => {
      const mock_auth = create_mock_auth_port(
        "player",
        false,
        "Token has expired",
      );
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.get_profile_permissions("expired-token");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.failure_type).toBe("token_expired");
      }
    });
  });

  describe("get_sidebar_menu_for_profile", () => {
    it("should return full menu for super_admin", async () => {
      const mock_auth = create_mock_auth_port("super_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.get_sidebar_menu_for_profile("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThan(0);
        const administration_group = result.data.find(
          (group: SidebarMenuGroup) => group.group_name === "Administration",
        );
        expect(administration_group).toBeDefined();
        const audit_trail_item = administration_group?.items.find(
          (item) => item.name === "Audit Trail",
        );
        expect(audit_trail_item).toBeDefined();
      }
    });

    it("should return limited menu for player", async () => {
      const mock_auth = create_mock_auth_port("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.get_sidebar_menu_for_profile("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        const administration_group = result.data.find(
          (group: SidebarMenuGroup) => group.group_name === "Administration",
        );
        expect(administration_group).toBeUndefined();
        const my_info_group = result.data.find(
          (group: SidebarMenuGroup) => group.group_name === "My Info",
        );
        expect(my_info_group).toBeDefined();
      }
    });

    it("should return failure for invalid token", async () => {
      const mock_auth = create_mock_auth_port("player", false);
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result =
        await adapter.get_sidebar_menu_for_profile("invalid-token");

      expect(result.success).toBe(false);
    });
  });

  describe("can_profile_access_route", () => {
    it("should allow super_admin to access system-users route", async () => {
      const mock_auth = create_mock_auth_port("super_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.can_profile_access_route(
        "valid-token",
        "/system-users",
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.route).toBe("/system-users");
        expect(result.data.all_accessible_routes.length).toBeGreaterThan(0);
      }
    });

    it("should allow org_admin to access settings", async () => {
      const mock_auth = create_mock_auth_port("org_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.can_profile_access_route(
        "valid-token",
        "/settings",
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.all_accessible_routes.length).toBeGreaterThan(0);
      }
    });

    it("should deny player access to settings", async () => {
      const mock_auth = create_mock_auth_port("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.can_profile_access_route(
        "valid-token",
        "/settings",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.route).toBe("/settings");
        expect(result.error.message).toContain("does not have access");
      }
    });

    it("should allow all roles to access home route", async () => {
      const mock_auth = create_mock_auth_port("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.can_profile_access_route("valid-token", "/");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.all_accessible_routes.length).toBeGreaterThan(0);
      }
    });

    it("should return failure for invalid token", async () => {
      const mock_auth = create_mock_auth_port("player", false);
      const adapter = new LocalAuthorizationAdapter(mock_auth);

      const result = await adapter.can_profile_access_route(
        "invalid-token",
        "/",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid or expired");
      }
    });
  });
});

describe("get_sidebar_menu_for_role", () => {
  it("should return full menu for super_admin", () => {
    const menu = get_sidebar_menu_for_role("super_admin");

    expect(menu.length).toBeGreaterThan(0);
    const administration_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Administration",
    );
    expect(administration_group).toBeDefined();
  });

  it("should return team-focused menu for team_manager", () => {
    const menu = get_sidebar_menu_for_role("team_manager");

    const my_team_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "My Team",
    );
    expect(my_team_group).toBeDefined();

    const organization_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Organization",
    );
    expect(organization_group).toBeUndefined();
  });

  it("should return officials-focused menu for officials_manager", () => {
    const menu = get_sidebar_menu_for_role("officials_manager");

    const officials_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Officials",
    );
    expect(officials_group).toBeDefined();
  });

  it("should return player info menu for player", () => {
    const menu = get_sidebar_menu_for_role("player");

    const my_info_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "My Info",
    );
    expect(my_info_group).toBeDefined();
  });

  it("should return public viewer menu with competition results and calendar", () => {
    const menu = get_sidebar_menu_for_role("public_viewer");

    expect(menu.length).toBeGreaterThan(0);

    const all_items = menu.flatMap(
      (group: SidebarMenuGroup) => group.items,
    );
    const hrefs = all_items.map((item: { href: string }) => item.href);

    expect(hrefs).toContain("/competition-results");
    expect(hrefs).toContain("/calendar");
  });

  it("should not include admin routes for public_viewer", () => {
    const menu = get_sidebar_menu_for_role("public_viewer");

    const administration_group = menu.find(
      (group: SidebarMenuGroup) => group.group_name === "Administration",
    );
    expect(administration_group).toBeUndefined();

    const all_items = menu.flatMap(
      (group: SidebarMenuGroup) => group.items,
    );
    const hrefs = all_items.map((item: { href: string }) => item.href);

    expect(hrefs).not.toContain("/system-users");
    expect(hrefs).not.toContain("/settings");
    expect(hrefs).not.toContain("/organizations");
  });
});

describe("can_role_access_route", () => {
  it("should allow super_admin to access admin routes", () => {
    const result = can_role_access_route("super_admin", "/system-users");
    expect(result.allowed).toBe(true);

    const result2 = can_role_access_route("super_admin", "/teams");
    expect(result2.allowed).toBe(true);

    const result3 = can_role_access_route("super_admin", "/organizations");
    expect(result3.allowed).toBe(true);
  });

  it("should allow org_admin to access settings", () => {
    const result = can_role_access_route("org_admin", "/settings");
    expect(result.allowed).toBe(true);
  });

  it("should deny player access to settings", () => {
    const result = can_role_access_route("player", "/settings");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("does not have access");
  });

  it("should allow player to access their own routes", () => {
    const result = can_role_access_route("player", "/players");
    expect(result.allowed).toBe(true);

    const result2 = can_role_access_route("player", "/player-profiles");
    expect(result2.allowed).toBe(false);
  });

  it("should always allow access to home route", () => {
    const roles: UserRole[] = [
      "super_admin",
      "org_admin",
      "team_manager",
      "player",
      "official",
      "public_viewer",
    ];

    for (const role of roles) {
      const result = can_role_access_route(role, "/");
      expect(result.allowed).toBe(true);
    }
  });

  it("should allow team_manager to access teams route", () => {
    const result = can_role_access_route("team_manager", "/teams");
    expect(result.allowed).toBe(true);
  });

  it("should deny team_manager access to organizations route", () => {
    const result = can_role_access_route("team_manager", "/organizations");
    expect(result.allowed).toBe(false);
  });

  it("should allow public_viewer to access competition-results", () => {
    const result = can_role_access_route(
      "public_viewer",
      "/competition-results",
    );
    expect(result.allowed).toBe(true);
  });

  it("should allow public_viewer to access calendar", () => {
    const result = can_role_access_route("public_viewer", "/calendar");
    expect(result.allowed).toBe(true);
  });

  it("should allow public_viewer to access match-report", () => {
    const result = can_role_access_route("public_viewer", "/match-report/123");
    expect(result.allowed).toBe(true);
  });

  it("should deny public_viewer access to admin routes", () => {
    const denied_routes = [
      "/system-users",
      "/settings",
      "/organizations",
      "/teams",
      "/players",
      "/officials",
      "/fixtures",
      "/audit-logs",
    ];

    for (const route of denied_routes) {
      const result = can_role_access_route("public_viewer", route);
      expect(result.allowed).toBe(false);
    }
  });
});

describe("get_allowed_routes_for_role", () => {
  it("should return comprehensive routes for super_admin", () => {
    const routes = get_allowed_routes_for_role("super_admin");

    expect(routes.has("/organizations")).toBe(true);
    expect(routes.has("/teams")).toBe(true);
    expect(routes.has("/players")).toBe(true);
  });

  it("should return limited routes for player", () => {
    const routes = get_allowed_routes_for_role("player");

    expect(routes.has("/players")).toBe(true);
    expect(routes.has("/player-profiles")).toBe(false);
    expect(routes.has("/organizations")).toBe(false);
    expect(routes.has("/teams")).toBe(false);
  });

  it("should return settings route for org_admin", () => {
    const routes = get_allowed_routes_for_role("org_admin");

    expect(routes.has("/settings")).toBe(true);
    expect(routes.has("/audit-logs")).toBe(true);
  });

  it("should return only public routes for public_viewer", () => {
    const routes = get_allowed_routes_for_role("public_viewer");

    expect(routes.has("/competition-results")).toBe(true);
    expect(routes.has("/calendar")).toBe(true);
    expect(routes.has("/organizations")).toBe(false);
    expect(routes.has("/teams")).toBe(false);
    expect(routes.has("/system-users")).toBe(false);
    expect(routes.has("/settings")).toBe(false);
  });
});
