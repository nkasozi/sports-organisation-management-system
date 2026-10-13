import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import type { DataAction } from "$lib/core/interfaces/ports";
import { create_some_option } from "$lib/core/types/Option";

import {
  check_entity_permission,
  find_entity_data_category,
  get_role_permissions_sync,
  map_authorizable_action_to_data_action,
} from "./authPermissionCore";

describe("authPermissionCore", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps entity types into the correct data categories", () => {
    expect(find_entity_data_category("organization")).toEqual(
      create_some_option("root_level"),
    );
    expect(find_entity_data_category("team")).toEqual(
      create_some_option("team_level"),
    );
    expect(find_entity_data_category("fixturelineup")).toEqual(
      create_some_option("player_level"),
    );
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

  it("maps authorizable actions exhaustively", () => {
    expectTypeOf(
      map_authorizable_action_to_data_action,
    ).returns.toEqualTypeOf<DataAction>();
    expect(map_authorizable_action_to_data_action("create")).toBe("create");
    expect(map_authorizable_action_to_data_action("edit")).toBe("update");
    expect(map_authorizable_action_to_data_action("delete")).toBe("delete");
    expect(map_authorizable_action_to_data_action("list")).toBe("read");
    expect(map_authorizable_action_to_data_action("view")).toBe("read");
  });
});
