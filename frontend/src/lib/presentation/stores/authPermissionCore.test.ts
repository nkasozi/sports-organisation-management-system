import { afterEach, describe, expect, it, vi } from "vitest";

import {
  check_entity_permission,
  get_entity_data_category,
  get_role_permissions_sync,
  map_authorizable_action_to_data_action,
} from "./authPermissionCore";

describe("authPermissionCore", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps entity types into the correct data categories", () => {
    expect(get_entity_data_category("organization")).toBe("root_level");
    expect(get_entity_data_category("team")).toBe("team_level");
    expect(get_entity_data_category("fixturelineup")).toBe("player_level");
  });

  it("adapts shared role permissions into CRUD permissions per category", () => {
    const result = get_role_permissions_sync("team_manager");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.team_level).toEqual({
        create: true,
        read: true,
        update: true,
        delete: false,
      });
      expect(
        check_entity_permission("team_manager", "team", "create", result.data),
      ).toBe(true);
      expect(
        check_entity_permission(
          "team_manager",
          "organization",
          "update",
          result.data,
        ),
      ).toBe(false);
    }
  });

  it("maps authorizable actions and reports unknown roles as failures", () => {
    const console_error_spy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(map_authorizable_action_to_data_action("create")).toBe("create");
    expect(map_authorizable_action_to_data_action("edit")).toBe("update");
    expect(map_authorizable_action_to_data_action("view")).toBe("read");
    expect(
      map_authorizable_action_to_data_action("archive" as never),
    ).toBeNull();
    expect(get_role_permissions_sync("ghost_role" as never)).toEqual({
      success: false,
      error: 'Unknown role: "ghost_role"',
    });
    expect(console_error_spy).toHaveBeenCalled();
  });
});
