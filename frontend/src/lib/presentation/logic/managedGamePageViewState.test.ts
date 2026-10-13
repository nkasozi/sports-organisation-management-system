import { describe, expect, it } from "vitest";

import { create_managed_game_page_state } from "./managedGamePageControllerState";
import {
  build_managed_game_page_title,
  derive_managed_game_view_state,
} from "./managedGamePageViewState";

describe("managedGamePageViewState", () => {
  it("falls back to default labels when no fixture or teams are loaded", () => {
    const state = create_managed_game_page_state();
    const view_state = derive_managed_game_view_state(state);

    expect(view_state.home_team_name).toBe("Home");
    expect(view_state.away_team_name).toBe("Away");
    expect(view_state.home_score).toBe(0);
    expect(view_state.away_score).toBe(0);
    expect(view_state.is_game_active).toBe(false);
    expect(view_state.sorted_events).toEqual([]);
    expect(view_state.available_players).toBe(state.home_players);
    expect(build_managed_game_page_title(state)).toBe("Game Management");
  });

  it("derives scores, team names, and the away player list for a present fixture", () => {
    const state = {
      ...create_managed_game_page_state(),
      fixture: {
        status: "present",
        fixture: {
          current_period: "second_half",
          home_team_score: 2,
          away_team_score: 1,
          status: "in_progress",
          game_events: [],
        },
      } as never,
      home_team: { status: "present", team: { name: "Lions" } } as never,
      away_team: { status: "present", team: { name: "Tigers" } } as never,
      selected_team_side: "away" as const,
      away_players: [{ id: "away-player" }],
    };
    const view_state = derive_managed_game_view_state(state);

    expect(view_state.home_score).toBe(2);
    expect(view_state.away_score).toBe(1);
    expect(view_state.is_game_active).toBe(true);
    expect(view_state.available_players).toEqual([{ id: "away-player" }]);
    expect(view_state.current_period_label).toBe("2nd Half");
    expect(build_managed_game_page_title(state)).toBe("Lions vs Tigers");
  });
});
