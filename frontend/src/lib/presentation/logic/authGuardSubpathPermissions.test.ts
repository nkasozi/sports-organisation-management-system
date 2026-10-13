import { describe, expect, it, vi } from "vitest";

import {
  is_role_permitted_for_route_subpath,
  resolve_route_subpath_requirement,
} from "./authGuardSubpathPermissions";

describe("resolve_route_subpath_requirement", () => {
  it.each([
    ["/competitions/create", "competition", "create"],
    ["/sports/create", "sport", "create"],
    ["/fixture-lineups/create", "fixturelineup", "create"],
    ["/player-team-memberships/bulk-assign", "playerteammembership", "create"],
    ["/competitions/abc-123/constraints", "competition", "update"],
    ["/teams/abc-123/edit", "team", "update"],
  ])(
    "requires the matching entity permission for %s",
    (pathname: string, entity_type: string, action: string) => {
      expect(resolve_route_subpath_requirement(pathname)).toEqual({
        status: "required",
        entity_type,
        action,
      });
    },
  );

  it.each(["/competitions", "/competitions/abc-123", "/", "", "/fixtures/f-1"])(
    "requires nothing beyond base route access for %j",
    (pathname: string) => {
      expect(resolve_route_subpath_requirement(pathname)).toEqual({
        status: "not_required",
      });
    },
  );

  it("marks action subpaths on unmapped routes as unverifiable", () => {
    expect(resolve_route_subpath_requirement("/mystery/create")).toEqual({
      status: "unverifiable",
    });
  });
});

describe("is_role_permitted_for_route_subpath", () => {
  it("allows an organisation admin to open the competition create page", () => {
    expect(
      is_role_permitted_for_route_subpath("org_admin", "/competitions/create"),
    ).toBe(true);
  });

  it.each(["player", "public_viewer", "official"] as const)(
    "denies the competition create page to %s",
    (role) => {
      expect(
        is_role_permitted_for_route_subpath(role, "/competitions/create"),
      ).toBe(false);
    },
  );

  it("denies the constraints editor to a player who can only read competitions", () => {
    expect(
      is_role_permitted_for_route_subpath(
        "player",
        "/competitions/abc-123/constraints",
      ),
    ).toBe(false);
  });

  it("keeps plain detail and list paths governed by base route access", () => {
    expect(
      is_role_permitted_for_route_subpath("player", "/competitions/abc-123"),
    ).toBe(true);
  });

  it("fails closed and logs for an action subpath it cannot verify", () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      is_role_permitted_for_route_subpath("super_admin", "/mystery/create"),
    ).toBe(false);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "auth_guard_route_subpath_unverifiable",
      }),
    );
  });
});
