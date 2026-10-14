import { describe, expect, it } from "vitest";

import {
  derive_on_field_players,
  validate_substitution,
} from "./liveGameOnFieldPlayers";
import { build_card_severity_rules } from "./liveGamePlayerAvailability";
import { OPEN_SUBSTITUTION_RULES } from "./liveGameSubstitutionRules";

const FOOTBALL_CARD_RULES = build_card_severity_rules([
  { id: "yellow_card", severity: "warning" },
  { id: "second_yellow", severity: "ejection" },
  { id: "red_card", severity: "ejection" },
]);

function player(id: string, overrides: Record<string, unknown> = {}): never {
  return {
    id,
    first_name: id,
    last_name: "Player",
    jersey_number: 1,
    is_substitute: false,
    time_on: "present_at_start",
    ...overrides,
  } as never;
}

function bench(id: string): never {
  return player(id, { is_substitute: true, time_on: "didnt_play" });
}

function event(
  event_type: string,
  minute: number,
  player_name: string,
  secondary_player_name = "",
  team_side = "home",
): never {
  return {
    id: `${event_type}-${minute}-${player_name}`,
    event_type,
    minute,
    team_side,
    player_name,
    secondary_player_name,
    recorded_at: `2024-01-01T00:${String(minute).padStart(2, "0")}:00.000Z`,
  } as never;
}

const OPEN_CONTEXT = {
  availability: {
    on_field_ids: new Set<string>(),
    ejected_ids: new Set<string>(),
    suspended_ids: new Set<string>(),
    substituted_off_ids: new Set<string>(),
    substitutions_used: 0,
  },
  rules: OPEN_SUBSTITUTION_RULES,
};

const PLAYERS = [player("a"), player("b"), bench("c"), bench("d")];

describe("derive_on_field_players", () => {
  it("starts with the starters", () => {
    expect(
      derive_on_field_players(PLAYERS, [], "home", FOOTBALL_CARD_RULES).map(
        (entry) => entry.id,
      ),
    ).toEqual(["a", "b"]);
  });

  it("swaps players on substitution", () => {
    const on_field = derive_on_field_players(
      [player("a"), player("b"), bench("c"), bench("d")],
      [event("substitution", 60, "c Player", "a Player")],
      "home",
      FOOTBALL_CARD_RULES,
    );
    expect(on_field.map((entry) => entry.id)).toEqual(["b", "c"]);
  });

  it("removes players who are sent off", () => {
    const on_field = derive_on_field_players(
      PLAYERS,
      [
        event("red_card", 20, "a Player"),
        event("second_yellow", 30, "b Player"),
      ],
      "home",
      FOOTBALL_CARD_RULES,
    );
    expect(on_field).toEqual([]);
  });

  it("ignores the other team's events", () => {
    const on_field = derive_on_field_players(
      PLAYERS,
      [event("red_card", 20, "a Player", "", "away")],
      "home",
      FOOTBALL_CARD_RULES,
    );
    expect(on_field.map((entry) => entry.id)).toEqual(["a", "b"]);
  });
});

describe("validate_substitution", () => {
  const on_field = [player("a"), player("b")];

  it("accepts a bench player replacing an on-field player", () => {
    expect(
      validate_substitution({
        on_field_players: on_field,
        player_on_id: "c",
        player_off_id: "a",
        max_players_on_field: 2,
        ...OPEN_CONTEXT,
      }).success,
    ).toBe(true);
  });

  it.each([
    ["the player coming on is already playing", "b", "a"],
    ["the player coming off is not playing", "c", "d"],
    ["no player coming on was chosen", "", "a"],
  ])("rejects when %s", (_label, player_on_id, player_off_id) => {
    expect(
      validate_substitution({
        on_field_players: on_field,
        player_on_id,
        player_off_id,
        max_players_on_field: 2,
        ...OPEN_CONTEXT,
      }).success,
    ).toBe(false);
  });

  it("rejects adding a player without one going off when the field is full", () => {
    expect(
      validate_substitution({
        on_field_players: on_field,
        player_on_id: "c",
        player_off_id: "",
        max_players_on_field: 2,
        ...OPEN_CONTEXT,
      }).success,
    ).toBe(false);
  });

  it("allows adding a player without one going off when there is room", () => {
    expect(
      validate_substitution({
        on_field_players: [player("a")],
        player_on_id: "c",
        player_off_id: "",
        max_players_on_field: 2,
        ...OPEN_CONTEXT,
      }).success,
    ).toBe(true);
  });
});
