import { describe, expect, it } from "vitest";

import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
} from "$convex/shared_permission_definitions";

import { get_allowed_routes_for_role } from "./LocalAuthorizationAdapter";

describe("entity category mapping — org_admin create/update permissions", () => {
  const ORG_ADMIN_MANAGED_ENTITIES = [
    "gender",
    "identificationtype",
    "gameofficialrole",
    "gameeventtype",
    "teamstaffrole",
    "playerposition",
  ] as const;

  it("org_admin should have full permissions on lookup/reference entities", () => {
    for (const entity of ORG_ADMIN_MANAGED_ENTITIES) {
      const category = SHARED_ENTITY_CATEGORY_MAP[entity];
      const permissions = SHARED_ROLE_PERMISSIONS["org_admin"][category];
      expect(
        permissions.can_create,
        `org_admin cannot create '${entity}' (mapped to '${category}') — update SHARED_ENTITY_CATEGORY_MAP`,
      ).toBe(true);
      expect(
        permissions.can_update,
        `org_admin cannot update '${entity}' (mapped to '${category}') — update SHARED_ENTITY_CATEGORY_MAP`,
      ).toBe(true);
    }
  });

  it("super_admin should retain full permissions on all entity categories", () => {
    for (const entity of ORG_ADMIN_MANAGED_ENTITIES) {
      const category = SHARED_ENTITY_CATEGORY_MAP[entity];
      const permissions = SHARED_ROLE_PERMISSIONS["super_admin"][category];
      expect(
        permissions.can_create,
        `super_admin lost create on '${entity}'`,
      ).toBe(true);
      expect(
        permissions.can_delete,
        `super_admin lost delete on '${entity}'`,
      ).toBe(true);
    }
  });

  it("non-admin roles should not be able to create or delete lookup entities", () => {
    const restricted_roles = [
      "team_manager",
      "official",
      "player",
      "public_viewer",
    ] as const;
    for (const entity of ORG_ADMIN_MANAGED_ENTITIES) {
      const category = SHARED_ENTITY_CATEGORY_MAP[entity];
      for (const role of restricted_roles) {
        const permissions = SHARED_ROLE_PERMISSIONS[role][category];
        expect(
          permissions.can_create,
          `role '${role}' should not create '${entity}'`,
        ).toBe(false);
        expect(
          permissions.can_delete,
          `role '${role}' should not delete '${entity}'`,
        ).toBe(false);
      }
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
