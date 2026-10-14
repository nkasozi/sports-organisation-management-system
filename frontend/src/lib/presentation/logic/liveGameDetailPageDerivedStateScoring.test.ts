import { describe, expect, it } from "vitest";

import { derive_live_game_detail_view_state } from "./liveGameDetailPageDerivedState";
import {
  create_live_game_detail_event_state,
  create_live_game_detail_page_state,
} from "./liveGameDetailPageStateFactories";

function lineup_player(
  id: string,
  first_name: string,
  is_substitute: boolean,
): never {
  return {
    id,
    first_name,
    last_name: "Smith",
    jersey_number: 1,
    position: "",
    is_captain: false,
    is_substitute,
    time_on: is_substitute ? "didnt_play" : "present_at_start",
  } as never;
}

function derive_options_for_event(event_type: {
  id: string;
  affects_score: boolean;
}): string[] {
  const derived_state = derive_live_game_detail_view_state({
    event_state: {
      ...create_live_game_detail_event_state(),
      selected_team_side: "home",
      selected_event_type: event_type as never,
    },
    page_state: {
      ...create_live_game_detail_page_state(),
      home_players: [
        lineup_player("p1", "Ann", false),
        lineup_player("p2", "Bea", false),
        lineup_player("p3", "Cat", true),
      ],
      fixture: {
        status: "in_progress",
        current_period: "first_half",
        game_events: [
          {
            id: "e1",
            event_type: "red_card",
            minute: 20,
            team_side: "home",
            player_name: "Ann Smith",
            player_id: "p1",
            secondary_player_name: "",
            recorded_at: "2024-01-01T10:20:00.000Z",
          },
        ],
      } as never,
    },
  });
  return derived_state.player_select_options.map((option) => option.value);
}

describe("scoring event player options", () => {
  it("offers only players on the field for a scoring event", () => {
    expect(
      derive_options_for_event({ id: "try", affects_score: true }),
    ).toEqual(["p2"]);
  });

  it("offers the whole squad for a disciplinary event", () => {
    expect(
      derive_options_for_event({ id: "yellow_card", affects_score: false }),
    ).toEqual(["p1", "p2", "p3"]);
  });
});
