import { describe, expect, it } from "vitest";

import { SEED_GENDER_IDS, SEED_TEAM_IDS } from "./seedIds";
import { create_seed_player_team_memberships } from "./seedMemberships";
import type { PositionIds } from "./seedPlayerIds";
import { create_seed_players } from "./seedPlayers";
import { SEED_SQUAD_SIZE } from "./seedSquadTopUp";

const POSITIONS = Object.fromEntries(
  ["gk", "sw", "cb", "lb", "rb", "cdm", "cm", "lm", "rm", "lw", "rw", "cf"].map(
    (key) => [key, `position_${key}`],
  ),
) as unknown as PositionIds;

const memberships = create_seed_player_team_memberships();
const players = create_seed_players(POSITIONS, "org_1" as never);

function members_of(team_id: string): typeof memberships {
  return memberships.filter(
    (membership) =>
      membership.team_id === team_id && membership.status === "active",
  );
}

describe("seed squads are big enough to field a full side", () => {
  it("gives every team a full squad", () => {
    for (const team_id of Object.values(SEED_TEAM_IDS))
      expect(members_of(team_id).length).toBeGreaterThanOrEqual(
        SEED_SQUAD_SIZE,
      );
  });

  it("never repeats a jersey number within a team", () => {
    for (const team_id of Object.values(SEED_TEAM_IDS)) {
      const numbers = members_of(team_id).map((m) => m.jersey_number);
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });

  it("creates a player for every membership and no duplicate ids", () => {
    const player_ids = new Set(players.map((player) => player.id));
    expect(player_ids.size).toBe(players.length);
    for (const membership of memberships)
      expect(player_ids.has(membership.player_id)).toBe(true);
  });

  it("fills women's teams with women", () => {
    const women_ids = new Set(
      members_of(SEED_TEAM_IDS.ROCKETS_HC_WOMEN).map((m) => m.player_id),
    );
    const genders = players
      .filter((player) => women_ids.has(player.id))
      .map((player) => player.gender_id);
    expect(new Set(genders)).toEqual(new Set([SEED_GENDER_IDS.FEMALE]));
  });
});
