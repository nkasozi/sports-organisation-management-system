import { afterEach, describe, expect, it, vi } from "vitest";

import type { SharedEntityType } from "$convex/shared_permission_definitions";

import type { UserRole } from "./AuthenticationPort";
import {
  check_data_permission,
  check_entity_permission,
  get_role_permissions,
} from "./authorizationPermissionChecks";

const UNKNOWN_ROLE = "retired_role" as UserRole;
const UNKNOWN_ENTITY = "unknownentity" as SharedEntityType;
const KNOWN_ROLE: UserRole = "super_admin";

describe("authorization permission checks fail closed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("grants no permission at all to a role that has no permission definition", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const role_permissions = get_role_permissions(UNKNOWN_ROLE);
    const granted_actions = Object.values(role_permissions).flatMap(
      (category_permissions) =>
        Object.values(category_permissions).filter(Boolean),
    );

    expect(granted_actions).toEqual([]);
    expect(check_data_permission(UNKNOWN_ROLE, "public_level", "read")).toBe(
      false,
    );
  });

  it("logs a structured warning when an unknown role is evaluated", () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    get_role_permissions(UNKNOWN_ROLE);

    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "authorization_unknown_role_denied" }),
    );
  });

  it("denies every action on an entity type that has no data category", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(check_entity_permission(KNOWN_ROLE, UNKNOWN_ENTITY, "read")).toBe(
      false,
    );
  });

  it("still grants a known role its defined permissions", () => {
    expect(check_entity_permission(KNOWN_ROLE, "team", "read")).toBe(true);
  });
});
