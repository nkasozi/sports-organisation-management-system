import { describe, expect, it } from "vitest";

import {
  is_record_owned_by_shared_owners,
  resolve_shared_entity_permission_scope,
  SharedCrudAction,
  SharedPermissionScope,
} from "./shared_own_record_permissions";

const OWN_PLAYER_ID = "player_a";
const OTHER_PLAYER_ID = "player_b";
const OWNERS = { player_ids: new Set([OWN_PLAYER_ID]) };
const ALL_ACTIONS = Object.values(SharedCrudAction);

describe("resolve_shared_entity_permission_scope", () => {
  it("scopes every player action on identifications to their own records", () => {
    for (const action of ALL_ACTIONS)
      expect(
        resolve_shared_entity_permission_scope(
          "player",
          "identification",
          action,
        ),
      ).toBe(SharedPermissionScope.OWN_RECORDS);
  });

  it("keeps player rights on other player-level entities at the category level", () => {
    expect(
      resolve_shared_entity_permission_scope(
        "player",
        "player",
        SharedCrudAction.UPDATE,
      ),
    ).toBe(SharedPermissionScope.ALL_RECORDS);
  });

  it("keeps administrator rights on identifications unscoped", () => {
    for (const role of ["super_admin", "org_admin"])
      for (const action of ALL_ACTIONS)
        expect(
          resolve_shared_entity_permission_scope(
            role,
            "identification",
            action,
          ),
        ).toBe(SharedPermissionScope.ALL_RECORDS);
  });

  it("leaves roles without a grant at their category permissions", () => {
    expect(
      resolve_shared_entity_permission_scope(
        "official",
        "identification",
        SharedCrudAction.CREATE,
      ),
    ).toBe(SharedPermissionScope.NONE);
    expect(
      resolve_shared_entity_permission_scope(
        "team_manager",
        "identification",
        SharedCrudAction.DELETE,
      ),
    ).toBe(SharedPermissionScope.NONE);
  });

  it("does not extend the player grant to other entities", () => {
    expect(
      resolve_shared_entity_permission_scope(
        "player",
        "qualification",
        SharedCrudAction.CREATE,
      ),
    ).toBe(SharedPermissionScope.NONE);
  });

  it("normalizes entity type separators and denies unknown roles or entities", () => {
    expect(
      resolve_shared_entity_permission_scope(
        "player",
        "Identification",
        SharedCrudAction.CREATE,
      ),
    ).toBe(SharedPermissionScope.OWN_RECORDS);
    expect(
      resolve_shared_entity_permission_scope(
        "intruder",
        "identification",
        SharedCrudAction.READ,
      ),
    ).toBe(SharedPermissionScope.NONE);
    expect(
      resolve_shared_entity_permission_scope(
        "super_admin",
        "unknown_entity",
        SharedCrudAction.READ,
      ),
    ).toBe(SharedPermissionScope.NONE);
  });
});

describe("is_record_owned_by_shared_owners", () => {
  it("owns identifications held by the caller's player", () => {
    expect(
      is_record_owned_by_shared_owners(
        "identification",
        { holder_type: "player", holder_id: ` ${OWN_PLAYER_ID} ` },
        OWNERS,
      ),
    ).toBe(true);
  });

  it("does not own identifications of other players or other holder types", () => {
    for (const record of [
      { holder_type: "player", holder_id: OTHER_PLAYER_ID },
      { holder_type: "official", holder_id: OWN_PLAYER_ID },
      { holder_type: "team_staff", holder_id: OWN_PLAYER_ID },
      { holder_type: "player", holder_id: "" },
      { holder_type: "player" },
      {},
    ])
      expect(
        is_record_owned_by_shared_owners("identification", record, OWNERS),
      ).toBe(false);
  });

  it("owns nothing when the caller is not linked to a player", () => {
    expect(
      is_record_owned_by_shared_owners(
        "identification",
        { holder_type: "player", holder_id: OWN_PLAYER_ID },
        { player_ids: new Set() },
      ),
    ).toBe(false);
  });

  it("owns nothing for entities without an ownership rule", () => {
    expect(
      is_record_owned_by_shared_owners(
        "qualification",
        { holder_type: "player", holder_id: OWN_PLAYER_ID },
        OWNERS,
      ),
    ).toBe(false);
  });
});
