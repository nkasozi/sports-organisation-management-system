import { describe, expect, it } from "vitest";

import type { UserRole } from "$lib/core/interfaces/ports";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

import type { AuthProfileState } from "../stores/authTypes";
import { PRESENCE_STATUS } from "./presenceStatus";
import { compute_sub_entity_disabled_functionalities } from "./subEntityPermissionLogic";

const OWN_PLAYER_ID = "player-own";
const OTHER_PLAYER_ID = "player-other";
const ALL_CRUD = ["create", "edit", "delete"];

function build_profile_state(
  role: UserRole,
  player_id: string,
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
      team_id: "",
      player_id,
    },
  };
}

function build_identification_filter(holder_id: string): SubEntityFilter {
  return {
    foreign_key_field: "holder_id",
    foreign_key_value: holder_id,
    holder_type_field: "holder_type",
    holder_type_value: "player",
  };
}

describe("compute_sub_entity_disabled_functionalities", () => {
  it("lets a player manage identifications under their own player", () => {
    expect(
      compute_sub_entity_disabled_functionalities(
        build_profile_state("player", OWN_PLAYER_ID),
        "identification",
        build_identification_filter(OWN_PLAYER_ID),
      ),
    ).toEqual([]);
  });

  it("hides create, edit and delete on another player's identifications", () => {
    expect(
      compute_sub_entity_disabled_functionalities(
        build_profile_state("player", OWN_PLAYER_ID),
        "identification",
        build_identification_filter(OTHER_PLAYER_ID),
      ),
    ).toEqual(ALL_CRUD);
  });

  it("keeps administrators able to manage any player's identifications", () => {
    expect(
      compute_sub_entity_disabled_functionalities(
        build_profile_state("org_admin", ""),
        "identification",
        build_identification_filter(OTHER_PLAYER_ID),
      ),
    ).toEqual([]);
  });

  it("follows category permissions for roles without an own-record grant", () => {
    expect(
      compute_sub_entity_disabled_functionalities(
        build_profile_state("team_manager", ""),
        "identification",
        build_identification_filter(OTHER_PLAYER_ID),
      ),
    ).toEqual(["delete"]);
  });

  it("disables everything when no profile is signed in", () => {
    expect(
      compute_sub_entity_disabled_functionalities(
        { status: PRESENCE_STATUS.MISSING },
        "identification",
        build_identification_filter(OWN_PLAYER_ID),
      ),
    ).toEqual(ALL_CRUD);
  });
});
