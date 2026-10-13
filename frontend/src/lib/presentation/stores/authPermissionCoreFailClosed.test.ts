import { afterEach, describe, expect, it, vi } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  check_entity_permission,
  find_entity_data_category,
  get_role_permissions_sync,
} from "./authPermissionCore";

const UNKNOWN_ROLE = "ghost_role" as never;
const UNKNOWN_ENTITY = "spaceship" as never;

describe("authPermissionCore fail-closed behaviour", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("finds categories for known entities and none for unknown ones", () => {
    expect(find_entity_data_category("team")).toEqual(
      create_some_option("team_level"),
    );
    expect(find_entity_data_category(UNKNOWN_ENTITY)).toEqual(
      create_none_option(),
    );
  });

  it("denies every permission for an unknown role and logs a structured warning", () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = get_role_permissions_sync(UNKNOWN_ROLE);

    expect(result.success).toBe(true);
    const all_permissions = result.success
      ? Object.values(result.data).flatMap((category) =>
          Object.values(category),
        )
      : [true];
    expect(all_permissions.length).toBeGreaterThan(0);
    expect(all_permissions.every((allowed) => allowed === false)).toBe(true);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "authorization_unknown_role_denied" }),
    );
  });

  it("denies unknown entity types even for super admins and logs a structured warning", () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const permissions = get_role_permissions_sync("super_admin");

    expect(permissions.success).toBe(true);
    expect(
      permissions.success &&
        check_entity_permission(
          "super_admin",
          UNKNOWN_ENTITY,
          "read",
          permissions.data,
        ),
    ).toBe(false);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "authorization_unknown_entity_denied",
        entity_type: UNKNOWN_ENTITY,
      }),
    );
  });
});
