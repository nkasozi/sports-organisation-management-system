import { describe, expect, it } from "vitest";

import { derive_live_game_detail_presentation_state } from "./liveGameDetailPagePresentationState";
import { create_live_game_detail_page_state } from "./liveGameDetailPageStateFactories";

describe("liveGameDetailPagePresentationState", () => {
  it("uses defaults when fixture, teams, and venue are missing", () => {
    expect(
      derive_live_game_detail_presentation_state(
        create_live_game_detail_page_state(),
      ),
    ).toEqual({
      assigned_officials: [],
      team_names: { home: "Home", away: "Away" },
      venue_name: "",
      venue_location: "",
      home_team_short_name: "HOM",
      away_team_short_name: "AWY",
      home_team_color: "#3b82f6",
      away_team_color: "#ef4444",
      officials_color: "",
    });
  });

  it("derives names, venue location, colors, and officials from loaded data", () => {
    const presentation_state = derive_live_game_detail_presentation_state({
      ...create_live_game_detail_page_state(),
      fixture: {
        home_team_id: "team-home",
        away_team_id: "team-away",
        venue: "Fallback Venue",
        home_team_jersey: { main_color: "#111111" },
        away_team_jersey: { main_color: "#222222" },
        officials_jersey: { main_color: "#333333" },
      } as never,
      home_team: { name: "lions" } as never,
      away_team: { name: "Tigers" } as never,
      venue: { name: "Arena", city: "", country: "Uganda" } as never,
      assigned_officials_data: [
        {
          official: { first_name: "Ada", last_name: "Stone" } as never,
          role_name: "Referee",
        },
      ],
    });

    expect(presentation_state).toEqual({
      assigned_officials: [{ name: "Ada Stone", role_name: "Referee" }],
      team_names: { "team-home": "lions", "team-away": "Tigers" },
      venue_name: "Arena",
      venue_location: "Uganda",
      home_team_short_name: "LIO",
      away_team_short_name: "TIG",
      home_team_color: "#111111",
      away_team_color: "#222222",
      officials_color: "#333333",
    });
  });

  it("joins city and country with a comma when both are present", () => {
    expect(
      derive_live_game_detail_presentation_state({
        ...create_live_game_detail_page_state(),
        venue: { name: "", city: "Kampala", country: "Uganda" } as never,
      }).venue_location,
    ).toBe("Kampala, Uganda");
  });
});
