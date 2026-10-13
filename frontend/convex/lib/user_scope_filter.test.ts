import { describe, expect, it } from "vitest";

import type { SystemUser } from "../authorization_helpers";
import { build_scope_filter, type SystemUserRecord } from "./auth_middleware";
import { build_user_scope_filter } from "./user_scope_filter";

function user(fields: Partial<SystemUser>): SystemUser {
  return {
    email: "user@example.com",
    role: "org_admin",
    ...fields,
  } as SystemUser;
}

describe("build_user_scope_filter", () => {
  it("returns no filter for global users", () => {
    expect(
      build_user_scope_filter(user({ organization_id: "*" }), "team"),
    ).toEqual({});
  });

  it("scopes organization roles and team managers", () => {
    expect(
      build_user_scope_filter(user({ organization_id: "org_a" }), "team"),
    ).toEqual({
      organization_id: "org_a",
    });
    expect(
      build_user_scope_filter(
        user({
          role: "team_manager",
          organization_id: "org_a",
          team_id: "team_1",
        }),
        "player",
      ),
    ).toEqual({ organization_id: "org_a", team_id: "team_1" });
  });

  it("limits officials and players to themselves for their own entity types", () => {
    const official = user({
      role: "official",
      organization_id: "org_a",
      official_id: "off_1",
    });
    expect(build_user_scope_filter(official, "Official")).toEqual({
      id: "off_1",
    });
    expect(build_user_scope_filter(official, "official_profile")).toEqual({
      id: "off_1",
    });
    const player = user({
      role: "player",
      organization_id: "org_a",
      player_id: "pl_1",
    });
    expect(build_user_scope_filter(player, "player-profile")).toEqual({
      id: "pl_1",
    });
    expect(build_user_scope_filter(player, "fixture")).toEqual({
      organization_id: "org_a",
    });
  });

  it("uses empty scope values for missing identifiers", () => {
    expect(build_user_scope_filter(user({}), "team")).toEqual({
      organization_id: "",
    });
  });
});

describe("server and client scope filters", () => {
  const roles = [
    "super_admin",
    "org_admin",
    "officials_manager",
    "team_manager",
    "official",
    "player",
    "public_viewer",
  ];
  const entity_types = [
    "team",
    "official",
    "officialprofile",
    "player",
    "player_profile",
  ];

  it("share a single rule for every role and entity type", () => {
    for (const role of roles) {
      const scoped_user = {
        _id: "system_users_1",
        email: "user@example.com",
        role,
        organization_id: "org_a",
        team_id: "team_1",
        player_id: "pl_1",
        official_id: "off_1",
      } as SystemUserRecord;
      for (const entity_type of entity_types)
        expect(build_user_scope_filter(scoped_user, entity_type)).toEqual(
          build_scope_filter(scoped_user, entity_type),
        );
    }
  });
});
