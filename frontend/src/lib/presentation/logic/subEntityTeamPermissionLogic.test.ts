import { describe, expect, it } from "vitest";

import type { UserRole } from "$lib/core/interfaces/ports";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

import type { AuthProfileState } from "../stores/authTypes";
import { PRESENCE_STATUS } from "./presenceStatus";
import { compute_sub_entity_disabled_functionalities } from "./subEntityPermissionLogic";

const OWN_TEAM_ID = "team-own";
const OTHER_TEAM_ID = "team-other";
const MEMBERSHIP_ENTITY_TYPE = "player_team_membership";

function build_profile_state(
  role: UserRole,
  team_id: string,
): AuthProfileState {
  return {
    status: PRESENCE_STATUS.PRESENT,
    profile: {
      id: "user-1",
      display_name: "User",
      email: "",
      role,
      organization_id: "org-1",
      organization_name: "Org",
      team_id,
    },
  };
}

function build_team_filter(team_id: string): SubEntityFilter {
  return { foreign_key_field: "team_id", foreign_key_value: team_id };
}

function is_create_disabled(role: UserRole, team_id: string): boolean {
  return compute_sub_entity_disabled_functionalities(
    build_profile_state(role, OWN_TEAM_ID),
    MEMBERSHIP_ENTITY_TYPE,
    build_team_filter(team_id),
  ).includes("create");
}

describe("team manager membership sub-entity permissions", () => {
  it("lets a team manager add memberships to their own team", () => {
    expect(is_create_disabled("team_manager", OWN_TEAM_ID)).toBe(false);
  });

  it("hides adding memberships to another team", () => {
    expect(is_create_disabled("team_manager", OTHER_TEAM_ID)).toBe(true);
  });

  it("hides editing memberships for a team manager", () => {
    expect(
      compute_sub_entity_disabled_functionalities(
        build_profile_state("team_manager", OWN_TEAM_ID),
        MEMBERSHIP_ENTITY_TYPE,
        build_team_filter(OWN_TEAM_ID),
      ),
    ).toContain("edit");
  });
});
