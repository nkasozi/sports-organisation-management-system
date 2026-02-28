import { describe, it, expect, beforeEach } from "vitest";
import { LocalAuthorizationAdapter } from "./LocalAuthorizationAdapter";
import type {
  AuthToken,
  AuthTokenPayload,
} from "$lib/core/interfaces/ports/AuthenticationPort";
import {
  ROLE_PERMISSIONS,
  ANY_VALUE,
} from "$lib/core/interfaces/ports/AuthenticationPort";
import type { AuthorizableAction, UserRole } from "$lib/core/interfaces/ports";

function create_test_token(
  role: UserRole,
  organization_id: string = ANY_VALUE,
  team_id: string = ANY_VALUE,
): AuthToken {
  const payload: AuthTokenPayload = {
    user_id: `test-${role}-123`,
    email: `${role}@test.com`,
    display_name: `Test ${role}`,
    role,
    organization_id,
    team_id,
    permissions: ROLE_PERMISSIONS[role],
    issued_at: Date.now(),
    expires_at: Date.now() + 365 * 24 * 60 * 60 * 1000,
  };

  return {
    payload,
    signature: "test-signature",
    raw_token: "header.payload.signature",
  };
}

describe("LocalAuthorizationAdapter", () => {
  let adapter: LocalAuthorizationAdapter;

  beforeEach(() => {
    adapter = new LocalAuthorizationAdapter();
  });

  describe("get_sidebar_menu_items", () => {
    it("should return full menu for super_admin", () => {
      const token = create_test_token("super_admin");
      const menu_items = adapter.get_sidebar_menu_items(token);

      expect(menu_items.length).toBeGreaterThan(0);

      const administration_group = menu_items.find(
        (g) => g.group_name === "Administration",
      );
      expect(administration_group).toBeDefined();

      const audit_trail_item = administration_group?.items.find(
        (i) => i.name === "Audit Trail",
      );
      expect(audit_trail_item).toBeDefined();

      const system_users_item = administration_group?.items.find(
        (i) => i.name === "System Users",
      );
      expect(system_users_item).toBeDefined();
    });

    it("should return limited menu for player role", () => {
      const token = create_test_token("player");
      const menu_items = adapter.get_sidebar_menu_items(token);

      expect(menu_items.length).toBeGreaterThan(0);

      const administration_group = menu_items.find(
        (g) => g.group_name === "Administration",
      );
      expect(administration_group).toBeUndefined();

      const my_profile_group = menu_items.find(
        (g) => g.group_name === "My Profile",
      );
      expect(my_profile_group).toBeDefined();
    });

    it("should return team-specific menu for team_manager", () => {
      const token = create_test_token("team_manager", "org-1", "team-1");
      const menu_items = adapter.get_sidebar_menu_items(token);

      const my_team_group = menu_items.find((g) => g.group_name === "My Team");
      expect(my_team_group).toBeDefined();

      const organization_group = menu_items.find(
        (g) => g.group_name === "Organization",
      );
      expect(organization_group).toBeUndefined();
    });

    it("should return officials-focused menu for officials_manager", () => {
      const token = create_test_token("officials_manager", "org-1", ANY_VALUE);
      const menu_items = adapter.get_sidebar_menu_items(token);

      const officials_group = menu_items.find(
        (g) => g.group_name === "Officials",
      );
      expect(officials_group).toBeDefined();

      const teams_group = menu_items.find((g) => g.group_name === "Teams");
      expect(teams_group).toBeUndefined();

      const players_group = menu_items.find((g) => g.group_name === "Players");
      expect(players_group).toBeUndefined();
    });
  });

  describe("get_user_authorization_level", () => {
    it("should return any-level access for super_admin on all entities", () => {
      const token = create_test_token("super_admin");
      const auth_map = adapter.get_user_authorization_level(
        token,
        "organization",
      );

      expect(auth_map.authorizations.get("create")).toBe("any");
      expect(auth_map.authorizations.get("edit")).toBe("any");
      expect(auth_map.authorizations.get("delete")).toBe("any");
      expect(auth_map.authorizations.get("list")).toBe("any");
      expect(auth_map.authorizations.get("view")).toBe("any");
    });

    it("should return org-level access for org_admin on teams", () => {
      const token = create_test_token("org_admin", "org-1");
      const auth_map = adapter.get_user_authorization_level(token, "team");

      expect(auth_map.authorizations.get("create")).toBe("organization");
      expect(auth_map.authorizations.get("edit")).toBe("organization");
      expect(auth_map.authorizations.get("delete")).toBe("organization");
    });

    it("should return team-level access for team_manager on team staff", () => {
      const token = create_test_token("team_manager", "org-1", "team-1");
      const auth_map = adapter.get_user_authorization_level(token, "teamstaff");

      expect(auth_map.authorizations.get("create")).toBe("team");
      expect(auth_map.authorizations.get("edit")).toBe("team");
      expect(auth_map.authorizations.get("delete")).toBe("team");
    });

    it("should return player-level access for player on player profile", () => {
      const token = create_test_token("player", "org-1", "team-1");
      const auth_map = adapter.get_user_authorization_level(
        token,
        "playerprofile",
      );

      expect(auth_map.authorizations.get("create")).toBe("player");
      expect(auth_map.authorizations.get("edit")).toBe("player");
      expect(auth_map.authorizations.get("delete")).toBe("none");
    });

    it("should return no access for player on system users", () => {
      const token = create_test_token("player");
      const auth_map = adapter.get_user_authorization_level(
        token,
        "systemuser",
      );

      expect(auth_map.authorizations.get("create")).toBe("none");
      expect(auth_map.authorizations.get("edit")).toBe("none");
      expect(auth_map.authorizations.get("delete")).toBe("none");
      expect(auth_map.authorizations.get("list")).toBe("none");
    });

    it("should normalize entity type with spaces and mixed case", () => {
      const token = create_test_token("super_admin");
      const auth_map = adapter.get_user_authorization_level(
        token,
        "Player Team Membership",
      );

      expect(auth_map.entity_type).toBe("playerteammembership");
      expect(auth_map.authorizations.get("create")).toBe("any");
    });
  });

  describe("is_authorized_to_execute", () => {
    it("should authorize super_admin for any action on any entity", () => {
      const token = create_test_token("super_admin");
      const result = adapter.is_authorized_to_execute(
        token,
        "create",
        "organization",
      );

      expect(result.is_authorized).toBe(true);
      expect(result.authorization_level).toBe("any");
    });

    it("should authorize org_admin for org-level action within their org", () => {
      const token = create_test_token("org_admin", "org-1");
      const result = adapter.is_authorized_to_execute(
        token,
        "edit",
        "team",
        "team-123",
        "org-1",
      );

      expect(result.is_authorized).toBe(true);
      expect(result.authorization_level).toBe("organization");
      expect(result.restricted_to_organization_id).toBe("org-1");
    });

    it("should deny org_admin for action outside their org", () => {
      const token = create_test_token("org_admin", "org-1");
      const result = adapter.is_authorized_to_execute(
        token,
        "edit",
        "team",
        "team-456",
        "org-2",
      );

      expect(result.is_authorized).toBe(false);
      expect(result.error_message).toContain("within your organization");
    });

    it("should authorize team_manager for team-level action within their team", () => {
      const token = create_test_token("team_manager", "org-1", "team-1");
      const result = adapter.is_authorized_to_execute(
        token,
        "create",
        "fixturelineup",
        undefined,
        "org-1",
        "team-1",
      );

      expect(result.is_authorized).toBe(true);
      expect(result.authorization_level).toBe("team");
      expect(result.restricted_to_team_id).toBe("team-1");
    });

    it("should deny team_manager for action outside their team", () => {
      const token = create_test_token("team_manager", "org-1", "team-1");
      const result = adapter.is_authorized_to_execute(
        token,
        "create",
        "fixturelineup",
        undefined,
        "org-1",
        "team-2",
      );

      expect(result.is_authorized).toBe(false);
      expect(result.error_message).toContain("for your team");
    });

    it("should deny player for creating system users", () => {
      const token = create_test_token("player");
      const result = adapter.is_authorized_to_execute(
        token,
        "create",
        "systemuser",
      );

      expect(result.is_authorized).toBe(false);
      expect(result.error_message).toContain("not permitted");
    });

    it("should authorize player for editing their own profile", () => {
      const token = create_test_token("player", "org-1", "team-1");
      const result = adapter.is_authorized_to_execute(
        token,
        "edit",
        "playerprofile",
      );

      expect(result.is_authorized).toBe(true);
      expect(result.authorization_level).toBe("player");
    });
  });

  describe("get_feature_access", () => {
    it("should grant full feature access to super_admin", () => {
      const token = create_test_token("super_admin");
      const access = adapter.get_feature_access(token);

      expect(access.can_reset_demo).toBe(true);
      expect(access.can_view_audit_logs).toBe(true);
      expect(access.can_access_dashboard).toBe(true);
      expect(access.audit_logs_scope).toBe("any");
    });

    it("should grant org-scoped feature access to org_admin", () => {
      const token = create_test_token("org_admin", "org-1");
      const access = adapter.get_feature_access(token);

      expect(access.can_reset_demo).toBe(true);
      expect(access.can_view_audit_logs).toBe(true);
      expect(access.audit_logs_scope).toBe("organization");
    });

    it("should deny feature access to officials_manager", () => {
      const token = create_test_token("officials_manager", "org-1");
      const access = adapter.get_feature_access(token);

      expect(access.can_reset_demo).toBe(false);
      expect(access.can_view_audit_logs).toBe(false);
      expect(access.can_access_dashboard).toBe(true);
    });

    it("should deny feature access to team_manager", () => {
      const token = create_test_token("team_manager", "org-1", "team-1");
      const access = adapter.get_feature_access(token);

      expect(access.can_reset_demo).toBe(false);
      expect(access.can_view_audit_logs).toBe(false);
      expect(access.can_access_dashboard).toBe(true);
    });

    it("should deny feature access to player", () => {
      const token = create_test_token("player");
      const access = adapter.get_feature_access(token);

      expect(access.can_reset_demo).toBe(false);
      expect(access.can_view_audit_logs).toBe(false);
      expect(access.can_access_dashboard).toBe(true);
    });
  });

  describe("get_authorization_error_message", () => {
    it("should generate user-friendly error message with camelCase entity", () => {
      const message = adapter.get_authorization_error_message(
        "player",
        "create",
        "systemUser",
      );

      expect(message).toContain("Create");
      expect(message).toContain("System User");
      expect(message).toContain("Player");
      expect(message).toContain("not permitted");
    });

    it("should handle lowercase entity names", () => {
      const message = adapter.get_authorization_error_message(
        "player",
        "delete",
        "organization",
      );

      expect(message).toContain("Delete");
      expect(message).toContain("Organization");
      expect(message).toContain("Player");
    });

    it("should handle camelCase entity names", () => {
      const message = adapter.get_authorization_error_message(
        "team_manager",
        "delete",
        "playerTeamMembership",
      );

      expect(message).toContain("Delete");
      expect(message).toContain("Player Team Membership");
      expect(message).toContain("Team Manager");
    });
  });

  describe("edge cases", () => {
    it("should handle unknown entity type gracefully", () => {
      const token = create_test_token("super_admin");
      const auth_map = adapter.get_user_authorization_level(
        token,
        "nonexistent_entity",
      );

      expect(auth_map.authorizations.get("create")).toBe("none");
      expect(auth_map.authorizations.get("edit")).toBe("none");
    });

    it("should handle wildcard organization_id for org_admin", () => {
      const token = create_test_token("org_admin", ANY_VALUE);
      const result = adapter.is_authorized_to_execute(
        token,
        "edit",
        "team",
        "team-123",
        "any-org",
      );

      expect(result.is_authorized).toBe(true);
    });

    it("should handle wildcard team_id for team_manager", () => {
      const token = create_test_token("team_manager", "org-1", ANY_VALUE);
      const result = adapter.is_authorized_to_execute(
        token,
        "create",
        "fixturelineup",
        undefined,
        "org-1",
        "any-team",
      );

      expect(result.is_authorized).toBe(true);
    });
  });
});
