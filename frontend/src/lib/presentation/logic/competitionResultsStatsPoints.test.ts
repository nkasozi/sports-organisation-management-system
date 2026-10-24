import { describe, expect, it } from "vitest";

import { create_score_award_resolver } from "$lib/core/entities/SportEventCatalog";

import { calculate_player_stats } from "./competitionResultsStats";

function create_score(event_type: string, id: string): object {
  return {
    id,
    event_type,
    minute: 5,
    stoppage_time_minute: 0,
    team_side: "home",
    player_name: "Peace",
    secondary_player_name: "",
    description: "",
    recorded_at: "2024-06-01T10:05:00.000Z",
  };
}

describe("calculate_player_stats for points-based sports", () => {
  it("adds the points each scoring event is worth", () => {
    const fixtures = [
      {
        home_team_id: "team_1",
        away_team_id: "team_2",
        game_events: [
          create_score("super_shot", "e1"),
          create_score("goal", "e2"),
        ],
      },
    ];

    const [player] = calculate_player_stats(
      fixtures as never,
      new Map([["team_1", { name: "Falcons" }]]) as never,
      create_score_award_resolver([
        { event_type: "goal", points_awarded: 1 },
        { event_type: "super_shot", points_awarded: 2 },
      ]),
      [],
    );

    expect(player).toMatchObject({
      player_name: "Peace",
      team_name: "Falcons",
      points: 3,
    });
  });

  it("keeps the points stored on each event when the rules change later", () => {
    const fixtures = [
      {
        home_team_id: "team_1",
        away_team_id: "team_2",
        game_events: [
          { ...create_score("goal", "e1"), points_awarded: 1 },
          { ...create_score("goal", "e2"), points_awarded: 0 },
        ],
      },
    ];

    const [player] = calculate_player_stats(
      fixtures as never,
      new Map([["team_1", { name: "Falcons" }]]) as never,
      create_score_award_resolver([{ event_type: "goal", points_awarded: 3 }]),
      [],
    );

    expect(player.points).toBe(1);
  });
});
