import { describe, expect, it } from "vitest";

import {
  build_card_severity_rules,
  derive_player_availability,
} from "./liveGamePlayerAvailability";

const HOCKEY_CARDS = build_card_severity_rules([
  { id: "green_card", severity: "suspension" },
  { id: "yellow_card", severity: "warning" },
  { id: "red_card", severity: "ejection" },
]);

function player(id: string, is_substitute = false): never {
  return {
    id,
    first_name: id,
    last_name: "Player",
    jersey_number: 1,
    is_substitute,
    time_on: is_substitute ? "didnt_play" : "present_at_start",
  } as never;
}

function event(
  event_type: string,
  minute: number,
  player_id: string,
  secondary_player_id = "",
): never {
  return {
    id: `${event_type}-${minute}-${player_id}`,
    event_type,
    minute,
    team_side: "home",
    player_name: "",
    secondary_player_name: "",
    player_id,
    ...(secondary_player_id ? { secondary_player_id } : {}),
    recorded_at: `2024-01-01T00:${String(minute).padStart(2, "0")}:00.000Z`,
  } as never;
}

const PLAYERS = [
  player("a"),
  player("b"),
  player("c", true),
  player("d", true),
];

function availability(
  events: never[],
): ReturnType<typeof derive_player_availability> {
  return derive_player_availability(PLAYERS, events, "home", HOCKEY_CARDS);
}

describe("derive_player_availability", () => {
  it("removes an ejected player for the rest of the game", () => {
    const result = availability([event("red_card", 10, "a")]);
    expect([...result.on_field_ids]).toEqual(["b"]);
    expect([...result.ejected_ids]).toEqual(["a"]);
  });

  it("removes a suspended player only until they return", () => {
    const suspended = availability([event("green_card", 10, "a")]);
    expect([...suspended.on_field_ids]).toEqual(["b"]);
    expect([...suspended.suspended_ids]).toEqual(["a"]);

    const returned = availability([
      event("green_card", 10, "a"),
      event("substitution", 12, "a"),
    ]);
    expect([...returned.on_field_ids].sort()).toEqual(["a", "b"]);
    expect(returned.suspended_ids.size).toBe(0);
    expect(returned.substitutions_used).toBe(0);
  });

  it("keeps warnings from affecting who is on the field", () => {
    expect(
      [...availability([event("yellow_card", 5, "a")]).on_field_ids].sort(),
    ).toEqual(["a", "b"]);
  });

  it("counts substitutions and remembers who was taken off", () => {
    const result = availability([event("substitution", 30, "c", "a")]);
    expect(result.substitutions_used).toBe(1);
    expect([...result.substituted_off_ids]).toEqual(["a"]);
    expect([...result.on_field_ids].sort()).toEqual(["b", "c"]);
  });

  it("ignores card types the sport does not know", () => {
    const result = availability([event("purple_card", 5, "a")]);
    expect(result.on_field_ids.has("a")).toBe(true);
  });
});
