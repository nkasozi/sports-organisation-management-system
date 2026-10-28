import { describe, expect, it } from "vitest";

import {
  is_record_owned_by_shared_owners,
  resolve_shared_entity_permission_scope,
  SharedCrudAction,
  SharedPermissionScope,
} from "./shared_own_record_permissions";

const TEAM_OWNERS = {
  player_ids: new Set<string>(),
  team_ids: new Set(["team_a"]),
};

describe("team manager membership grant", () => {
  it("lets a team manager create memberships only for their own teams", () => {
    expect(
      resolve_shared_entity_permission_scope(
        "team_manager",
        "playerteammembership",
        SharedCrudAction.CREATE,
      ),
    ).toBe(SharedPermissionScope.OWN_RECORDS);
  });

  it("keeps team manager membership reads organisation wide and updates denied", () => {
    expect(
      resolve_shared_entity_permission_scope(
        "team_manager",
        "playerteammembership",
        SharedCrudAction.READ,
      ),
    ).toBe(SharedPermissionScope.ALL_RECORDS);
    expect(
      resolve_shared_entity_permission_scope(
        "team_manager",
        "playerteammembership",
        SharedCrudAction.UPDATE,
      ),
    ).toBe(SharedPermissionScope.NONE);
  });

  it("treats a membership as owned when its team is one of the owner teams", () => {
    expect(
      is_record_owned_by_shared_owners(
        "playerteammembership",
        { team_id: "team_a", player_id: "player_x" },
        TEAM_OWNERS,
      ),
    ).toBe(true);
    expect(
      is_record_owned_by_shared_owners(
        "playerteammembership",
        { team_id: "team_b", player_id: "player_x" },
        TEAM_OWNERS,
      ),
    ).toBe(false);
  });

  it("never treats a membership as owned when the owners carry no teams", () => {
    expect(
      is_record_owned_by_shared_owners(
        "playerteammembership",
        { team_id: "team_a" },
        { player_ids: new Set(["player_x"]) },
      ),
    ).toBe(false);
  });
});

describe("official live game grants", () => {
  it("lets officials create live game logs and game event logs", () => {
    for (const entity_type of ["livegamelog", "gameeventlog"])
      expect(
        resolve_shared_entity_permission_scope(
          "official",
          entity_type,
          SharedCrudAction.CREATE,
        ),
      ).toBe(SharedPermissionScope.ALL_RECORDS);
  });

  it("lets the official starting a game save the squads it builds automatically", () => {
    expect(
      resolve_shared_entity_permission_scope(
        "official",
        "fixturelineup",
        SharedCrudAction.CREATE,
      ),
    ).toBe(SharedPermissionScope.ALL_RECORDS);
    expect(
      resolve_shared_entity_permission_scope(
        "official",
        "fixturelineup",
        SharedCrudAction.DELETE,
      ),
    ).toBe(SharedPermissionScope.NONE);
  });

  it("does not let officials delete live game logs or create other organisation data", () => {
    expect(
      resolve_shared_entity_permission_scope(
        "official",
        "livegamelog",
        SharedCrudAction.DELETE,
      ),
    ).toBe(SharedPermissionScope.NONE);
    expect(
      resolve_shared_entity_permission_scope(
        "official",
        "fixture",
        SharedCrudAction.CREATE,
      ),
    ).toBe(SharedPermissionScope.NONE);
  });
});
