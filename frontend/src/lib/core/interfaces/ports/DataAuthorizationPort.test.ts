import { describe, it, expect } from "vitest";
import {
  check_data_permission,
  check_entity_permission,
  authorize_entity_action,
  get_allowed_actions_for_entity,
  get_disabled_crud_for_entity,
  get_entity_data_category,
  DATA_PERMISSION_MAP,
} from "./DataAuthorizationPort";

describe("DataAuthorizationPort", () => {
  describe("get_entity_data_category", () => {
    it("should categorize organization as root_level", () => {
      expect(get_entity_data_category("organization")).toBe("root_level");
      expect(get_entity_data_category("Organization")).toBe("root_level");
    });

    it("should categorize competition as organisation_level", () => {
      expect(get_entity_data_category("competition")).toBe(
        "organisation_level",
      );
      expect(get_entity_data_category("Competition")).toBe(
        "organisation_level",
      );
    });

    it("should categorize teamstaff as team_level", () => {
      expect(get_entity_data_category("teamstaff")).toBe("team_level");
      expect(get_entity_data_category("TeamStaff")).toBe("team_level");
    });

    it("should categorize player as player_level", () => {
      expect(get_entity_data_category("player")).toBe("player_level");
      expect(get_entity_data_category("Player")).toBe("player_level");
    });

    it("should default to organisation_level for unknown entities", () => {
      expect(get_entity_data_category("unknown_entity")).toBe(
        "organisation_level",
      );
    });
  });

  describe("check_data_permission", () => {
    describe("super_admin", () => {
      it("should have full permissions at all levels", () => {
        expect(
          check_data_permission("super_admin", "root_level", "create"),
        ).toBe(true);
        expect(check_data_permission("super_admin", "root_level", "read")).toBe(
          true,
        );
        expect(
          check_data_permission("super_admin", "root_level", "update"),
        ).toBe(true);
        expect(
          check_data_permission("super_admin", "root_level", "delete"),
        ).toBe(true);

        expect(
          check_data_permission("super_admin", "organisation_level", "create"),
        ).toBe(true);
        expect(
          check_data_permission("super_admin", "team_level", "delete"),
        ).toBe(true);
        expect(
          check_data_permission("super_admin", "player_level", "update"),
        ).toBe(true);
      });
    });

    describe("org_admin", () => {
      it("should only have read permission at root_level", () => {
        expect(check_data_permission("org_admin", "root_level", "create")).toBe(
          false,
        );
        expect(check_data_permission("org_admin", "root_level", "read")).toBe(
          true,
        );
        expect(check_data_permission("org_admin", "root_level", "update")).toBe(
          false,
        );
        expect(check_data_permission("org_admin", "root_level", "delete")).toBe(
          false,
        );
      });

      it("should have full permissions at organisation_level and below", () => {
        expect(
          check_data_permission("org_admin", "organisation_level", "create"),
        ).toBe(true);
        expect(
          check_data_permission("org_admin", "organisation_level", "delete"),
        ).toBe(true);
        expect(check_data_permission("org_admin", "team_level", "create")).toBe(
          true,
        );
        expect(
          check_data_permission("org_admin", "player_level", "update"),
        ).toBe(true);
      });
    });

    describe("team_manager", () => {
      it("should only have read permission at root and organisation levels", () => {
        expect(
          check_data_permission("team_manager", "root_level", "create"),
        ).toBe(false);
        expect(
          check_data_permission("team_manager", "root_level", "read"),
        ).toBe(true);
        expect(
          check_data_permission("team_manager", "organisation_level", "create"),
        ).toBe(false);
        expect(
          check_data_permission("team_manager", "organisation_level", "read"),
        ).toBe(true);
      });

      it("should have full permissions at team_level and player_level", () => {
        expect(
          check_data_permission("team_manager", "team_level", "create"),
        ).toBe(true);
        expect(
          check_data_permission("team_manager", "team_level", "delete"),
        ).toBe(true);
        expect(
          check_data_permission("team_manager", "player_level", "create"),
        ).toBe(true);
        expect(
          check_data_permission("team_manager", "player_level", "update"),
        ).toBe(true);
      });
    });

    describe("player", () => {
      it("should only have read permission at most levels", () => {
        expect(check_data_permission("player", "root_level", "read")).toBe(
          true,
        );
        expect(check_data_permission("player", "root_level", "create")).toBe(
          false,
        );
        expect(
          check_data_permission("player", "organisation_level", "read"),
        ).toBe(true);
        expect(
          check_data_permission("player", "organisation_level", "update"),
        ).toBe(false);
        expect(check_data_permission("player", "team_level", "read")).toBe(
          true,
        );
        expect(check_data_permission("player", "team_level", "delete")).toBe(
          false,
        );
      });

      it("should have read and update at player_level only", () => {
        expect(check_data_permission("player", "player_level", "read")).toBe(
          true,
        );
        expect(check_data_permission("player", "player_level", "update")).toBe(
          true,
        );
        expect(check_data_permission("player", "player_level", "create")).toBe(
          false,
        );
        expect(check_data_permission("player", "player_level", "delete")).toBe(
          false,
        );
      });
    });
  });

  describe("check_entity_permission", () => {
    it("should check permissions for organization entity correctly", () => {
      expect(
        check_entity_permission("super_admin", "organization", "create"),
      ).toBe(true);
      expect(
        check_entity_permission("org_admin", "organization", "create"),
      ).toBe(false);
      expect(check_entity_permission("org_admin", "organization", "read")).toBe(
        true,
      );
    });

    it("should check permissions for competition entity correctly", () => {
      expect(
        check_entity_permission("org_admin", "competition", "create"),
      ).toBe(true);
      expect(
        check_entity_permission("team_manager", "competition", "create"),
      ).toBe(false);
      expect(
        check_entity_permission("team_manager", "competition", "read"),
      ).toBe(true);
    });

    it("should check permissions for player entity correctly", () => {
      expect(check_entity_permission("team_manager", "player", "create")).toBe(
        true,
      );
      expect(check_entity_permission("player", "player", "create")).toBe(false);
      expect(check_entity_permission("player", "player", "update")).toBe(true);
    });
  });

  describe("authorize_entity_action", () => {
    it("should return authorized result with correct metadata", () => {
      const result = authorize_entity_action(
        "org_admin",
        "competition",
        "create",
      );

      expect(result.is_authorized).toBe(true);
      expect(result.data_category).toBe("organisation_level");
      expect(result.action).toBe("create");
      expect(result.reason).toBeUndefined();
    });

    it("should return unauthorized result with reason", () => {
      const result = authorize_entity_action(
        "team_manager",
        "competition",
        "create",
      );

      expect(result.is_authorized).toBe(false);
      expect(result.data_category).toBe("organisation_level");
      expect(result.action).toBe("create");
      expect(result.reason).toContain("team_manager");
      expect(result.reason).toContain("create");
      expect(result.reason).toContain("organisation_level");
    });
  });

  describe("get_allowed_actions_for_entity", () => {
    it("should return all actions for super_admin on any entity", () => {
      const actions = get_allowed_actions_for_entity(
        "super_admin",
        "organization",
      );
      expect(actions).toContain("create");
      expect(actions).toContain("read");
      expect(actions).toContain("update");
      expect(actions).toContain("delete");
    });

    it("should return only read for org_admin on organization", () => {
      const actions = get_allowed_actions_for_entity(
        "org_admin",
        "organization",
      );
      expect(actions).toEqual(["read"]);
    });

    it("should return read and update for player on player entities", () => {
      const actions = get_allowed_actions_for_entity("player", "playerprofile");
      expect(actions).toContain("read");
      expect(actions).toContain("update");
      expect(actions).not.toContain("create");
      expect(actions).not.toContain("delete");
    });
  });

  describe("get_disabled_crud_for_entity", () => {
    it("should return empty array for super_admin", () => {
      const disabled = get_disabled_crud_for_entity(
        "super_admin",
        "competition",
      );
      expect(disabled).toEqual([]);
    });

    it("should return create, update, delete for org_admin on organization", () => {
      const disabled = get_disabled_crud_for_entity(
        "org_admin",
        "organization",
      );
      expect(disabled).toContain("create");
      expect(disabled).toContain("update");
      expect(disabled).toContain("delete");
      expect(disabled).not.toContain("read");
    });

    it("should return create and delete for player on player entities", () => {
      const disabled = get_disabled_crud_for_entity("player", "player");
      expect(disabled).toContain("create");
      expect(disabled).toContain("delete");
      expect(disabled).not.toContain("read");
      expect(disabled).not.toContain("update");
    });
  });

  describe("DATA_PERMISSION_MAP completeness", () => {
    const all_roles = [
      "super_admin",
      "org_admin",
      "officials_manager",
      "team_manager",
      "official",
      "player",
    ] as const;

    const all_categories = [
      "root_level",
      "organisation_level",
      "team_level",
      "player_level",
    ] as const;

    it("should have permissions defined for all roles", () => {
      for (const role of all_roles) {
        expect(DATA_PERMISSION_MAP[role]).toBeDefined();
      }
    });

    it("should have all categories defined for each role", () => {
      for (const role of all_roles) {
        for (const category of all_categories) {
          expect(DATA_PERMISSION_MAP[role][category]).toBeDefined();
        }
      }
    });

    it("should have all actions defined for each category", () => {
      for (const role of all_roles) {
        for (const category of all_categories) {
          const permissions = DATA_PERMISSION_MAP[role][category];
          expect(typeof permissions.create).toBe("boolean");
          expect(typeof permissions.read).toBe("boolean");
          expect(typeof permissions.update).toBe("boolean");
          expect(typeof permissions.delete).toBe("boolean");
        }
      }
    });
  });
});
