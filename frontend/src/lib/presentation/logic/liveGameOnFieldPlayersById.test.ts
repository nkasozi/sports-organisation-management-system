import { describe, expect, it } from "vitest";

import {
  derive_dismissed_player_ids,
  derive_on_field_players,
} from "./liveGameOnFieldPlayers";

function player(
  id: string,
  first_name: string,
  overrides: Record<string, unknown> = {},
): never {
  return {
    id,
    first_name,
    last_name: "Smith",
    jersey_number: 1,
    is_substitute: false,
    time_on: "present_at_start",
    ...overrides,
  } as never;
}

function bench(id: string, first_name: string): never {
  return player(id, first_name, { is_substitute: true, time_on: "didnt_play" });
}

function event(fields: Record<string, unknown>): never {
  return {
    id: `event-${String(fields.minute)}`,
    team_side: "home",
    player_name: "",
    secondary_player_name: "",
    recorded_at: "2024-01-01T00:00:00.000Z",
    ...fields,
  } as never;
}

describe("derive_on_field_players with player ids", () => {
  it("swaps the exact players named by id even when names are shared", () => {
    const players = [
      player("p1", "John"),
      player("p2", "John"),
      bench("p3", "Ken"),
    ];
    const on_field = derive_on_field_players(
      players,
      [
        event({
          event_type: "substitution",
          minute: 60,
          player_name: "Ken Smith",
          player_id: "p3",
          secondary_player_name: "John Smith",
          secondary_player_id: "p2",
        }),
      ],
      "home",
    );
    expect(on_field.map((entry) => entry.id)).toEqual(["p1", "p3"]);
  });

  it("keeps tracking a player by id after their name changes", () => {
    const players = [player("p1", "Renamed"), bench("p2", "Ken")];
    const on_field = derive_on_field_players(
      players,
      [
        event({
          event_type: "red_card",
          minute: 30,
          player_name: "Old Name",
          player_id: "p1",
        }),
      ],
      "home",
    );
    expect(on_field).toEqual([]);
  });

  it("still matches older events by name", () => {
    const players = [player("p1", "Ann"), bench("p2", "Ken")];
    const on_field = derive_on_field_players(
      players,
      [
        event({
          event_type: "substitution",
          minute: 40,
          player_name: "Ken Smith",
          secondary_player_name: "Ann Smith",
        }),
      ],
      "home",
    );
    expect(on_field.map((entry) => entry.id)).toEqual(["p2"]);
  });
});

describe("derive_dismissed_player_ids", () => {
  it("lists players sent off by id or by name for the team", () => {
    const players = [
      player("p1", "Ann"),
      player("p2", "Bea"),
      bench("p3", "Cat"),
    ];
    const dismissed = derive_dismissed_player_ids(
      players,
      [
        event({ event_type: "red_card", minute: 10, player_id: "p1" }),
        event({
          event_type: "second_yellow",
          minute: 20,
          player_name: "Cat Smith",
        }),
        event({ event_type: "yellow_card", minute: 30, player_id: "p2" }),
        event({
          event_type: "red_card",
          minute: 35,
          player_id: "p2",
          team_side: "away",
        }),
      ],
      "home",
    );
    expect([...dismissed].sort()).toEqual(["p1", "p3"]);
  });
});
