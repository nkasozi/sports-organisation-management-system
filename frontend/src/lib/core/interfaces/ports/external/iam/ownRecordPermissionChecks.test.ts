import { describe, expect, it } from "vitest";

import {
  build_record_owners_for_player,
  check_entity_permission_in_any_scope,
  ENTITY_PERMISSION_SCOPE,
  is_entity_action_permitted_for_record,
  resolve_entity_permission_scope,
} from "./ownRecordPermissionChecks";

const OWN_RECORD = { holder_type: "player", holder_id: "player-1" };
const OTHER_RECORD = { holder_type: "player", holder_id: "player-2" };

describe("resolve_entity_permission_scope", () => {
  it("matches the server scope for players on identifications", () => {
    expect(
      resolve_entity_permission_scope("player", "identification", "create"),
    ).toBe(ENTITY_PERMISSION_SCOPE.OWN_RECORDS);
    expect(
      resolve_entity_permission_scope("org_admin", "identification", "delete"),
    ).toBe(ENTITY_PERMISSION_SCOPE.ALL_RECORDS);
    expect(
      resolve_entity_permission_scope("official", "identification", "update"),
    ).toBe(ENTITY_PERMISSION_SCOPE.NONE);
  });
});

describe("check_entity_permission_in_any_scope", () => {
  it("lets players create identifications somewhere and denies officials", () => {
    expect(
      check_entity_permission_in_any_scope(
        "player",
        "identification",
        "create",
      ),
    ).toBe(true);
    expect(
      check_entity_permission_in_any_scope(
        "official",
        "identification",
        "create",
      ),
    ).toBe(false);
  });
});

describe("build_record_owners_for_player", () => {
  it("owns nothing when the user has no linked player", () => {
    expect(build_record_owners_for_player("").player_ids.size).toBe(0);
    expect(build_record_owners_for_player(" ").player_ids.size).toBe(0);
  });

  it("owns the linked player", () => {
    expect(
      build_record_owners_for_player("player-1").player_ids.has("player-1"),
    ).toBe(true);
  });
});

describe("is_entity_action_permitted_for_record", () => {
  const owners = build_record_owners_for_player("player-1");

  it("lets players act only on their own identifications", () => {
    for (const action of ["create", "update", "delete"] as const) {
      expect(
        is_entity_action_permitted_for_record({
          role: "player",
          entity_type: "identification",
          action,
          record: OWN_RECORD,
          owners,
        }),
      ).toBe(true);
      expect(
        is_entity_action_permitted_for_record({
          role: "player",
          entity_type: "identification",
          action,
          record: OTHER_RECORD,
          owners,
        }),
      ).toBe(false);
    }
  });

  it("lets administrators act on any identification", () => {
    expect(
      is_entity_action_permitted_for_record({
        role: "org_admin",
        entity_type: "identification",
        action: "delete",
        record: OTHER_RECORD,
        owners: build_record_owners_for_player(""),
      }),
    ).toBe(true);
  });

  it("denies roles without permission even on their own records", () => {
    expect(
      is_entity_action_permitted_for_record({
        role: "official",
        entity_type: "identification",
        action: "create",
        record: OWN_RECORD,
        owners,
      }),
    ).toBe(false);
  });
});
