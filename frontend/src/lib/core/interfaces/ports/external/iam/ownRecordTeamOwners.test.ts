import { describe, expect, it } from "vitest";

import {
  build_record_owners_for_player,
  build_record_owners_for_profile,
  is_entity_action_permitted_for_record,
} from "./ownRecordPermissionChecks";

const OWN_TEAM_ID = "team-own";
const OTHER_TEAM_ID = "team-other";
const MEMBERSHIP_ENTITY_TYPE = "playerteammembership";

describe("build_record_owners_for_profile", () => {
  it("owns the managed team for a team manager", () => {
    const owners = build_record_owners_for_profile({
      role: "team_manager",
      team_id: OWN_TEAM_ID,
      player_id: "",
    });
    expect([...owners.team_ids]).toEqual([OWN_TEAM_ID]);
    expect(owners.player_ids.size).toBe(0);
  });

  it("owns the linked player for a player and no teams", () => {
    const owners = build_record_owners_for_profile({
      role: "player",
      team_id: OWN_TEAM_ID,
      player_id: " player-1 ",
    });
    expect([...owners.player_ids]).toEqual(["player-1"]);
    expect(owners.team_ids.size).toBe(0);
  });

  it("owns no team for roles other than team manager", () => {
    const owners = build_record_owners_for_profile({
      role: "official",
      team_id: OWN_TEAM_ID,
      player_id: "",
    });
    expect(owners.team_ids.size).toBe(0);
  });

  it("owns no team when a team manager has no team assigned", () => {
    const owners = build_record_owners_for_profile({
      role: "team_manager",
      team_id: "  ",
      player_id: "",
    });
    expect(owners.team_ids.size).toBe(0);
  });

  it("gives player-only owners an empty team set", () => {
    expect(build_record_owners_for_player("player-1").team_ids.size).toBe(0);
  });
});

describe("team manager membership permissions", () => {
  const owners = build_record_owners_for_profile({
    role: "team_manager",
    team_id: OWN_TEAM_ID,
    player_id: "",
  });

  function is_permitted(action: "create" | "update", team_id: string): boolean {
    return is_entity_action_permitted_for_record({
      role: "team_manager",
      entity_type: MEMBERSHIP_ENTITY_TYPE,
      action,
      record: { team_id, player_id: "player-x" },
      owners,
    });
  }

  it("allows creating memberships in the managed team", () => {
    expect(is_permitted("create", OWN_TEAM_ID)).toBe(true);
  });

  it("denies creating memberships in another team", () => {
    expect(is_permitted("create", OTHER_TEAM_ID)).toBe(false);
  });

  it("denies updating memberships even in the managed team", () => {
    expect(is_permitted("update", OWN_TEAM_ID)).toBe(false);
  });
});
