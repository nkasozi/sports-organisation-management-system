import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import { create_score_award_resolver } from "$lib/core/entities/SportEventCatalog";
import type { Team } from "$lib/core/entities/Team";

import { build_card_stat_categories } from "./competitionResultsCardStats";
import { calculate_player_stats } from "./competitionResultsStats";

const FOOTBALL_CARD_CATEGORIES = build_card_stat_categories({
  card_types: [{ id: "yellow_card", name: "Yellow Card" }],
  card_type_colors: [],
  card_weights: new Map(),
});

function create_test_team(team: { id: string; name: string }): Team {
  return team as unknown as Team;
}

function create_test_fixture(fixture: Record<string, unknown>): Fixture {
  return {
    id: "fixture_1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    scheduled_date: "2024-06-01",
    scheduled_time: "10:00",
    game_events: [],
    ...fixture,
  } as unknown as Fixture;
}

describe("calculate_player_stats identity and moments", () => {
  it("keeps one row per player across home and away games, and separates namesakes on different teams", () => {
    const team_map = new Map<string, Team>([
      ["team_1", create_test_team({ id: "team_1", name: "Falcons" })],
      ["team_2", create_test_team({ id: "team_2", name: "Wolves" })],
      ["team_3", create_test_team({ id: "team_3", name: "Hawks" })],
    ]);
    const goal = (
      id: string,
      team_side: string,
      player_name: string,
    ): Record<string, unknown> => ({
      id,
      event_type: "goal",
      minute: 10,
      stoppage_time_minute: 0,
      team_side,
      player_name,
      secondary_player_name: "",
      description: "Goal",
      recorded_at: "2024-06-01T10:10:00.000Z",
    });
    const fixtures = [
      create_test_fixture({
        id: "fixture_home",
        home_team_id: "team_1",
        away_team_id: "team_2",
        game_events: [goal("event_1", "home", "Alex")],
      }),
      create_test_fixture({
        id: "fixture_away",
        home_team_id: "team_3",
        away_team_id: "team_1",
        game_events: [
          goal("event_2", "away", "Alex"),
          goal("event_3", "home", "Alex"),
        ],
      }),
    ] as Fixture[];

    const stats = calculate_player_stats(
      fixtures,
      team_map,
      create_score_award_resolver([]),
      FOOTBALL_CARD_CATEGORIES,
      new Map(),
    );

    expect(
      stats.map((player) => [
        player.player_name,
        player.team_name,
        player.points,
      ]),
    ).toEqual([
      ["Alex", "Falcons", 2],
      ["Alex", "Hawks", 1],
    ]);
  });

  it("counts assists and labels moments by period when no minute was recorded", () => {
    const team_map = new Map<string, Team>([
      ["team_1", create_test_team({ id: "team_1", name: "Falcons" })],
      ["team_2", create_test_team({ id: "team_2", name: "Wolves" })],
    ]);
    const fixtures = [
      create_test_fixture({
        game_events: [
          {
            id: "event_1",
            event_type: "assist",
            minute: 0,
            stoppage_time_minute: 0,
            team_side: "home",
            player_name: "Sam",
            secondary_player_name: "",
            description: "Assist",
            recorded_at: "",
            period_id: "second_quarter",
          },
        ],
      }),
    ] as Fixture[];

    const [sam] = calculate_player_stats(
      fixtures,
      team_map,
      create_score_award_resolver([]),
      FOOTBALL_CARD_CATEGORIES,
      new Map([["second_quarter", { name: "2nd Quarter", order: 3 }]]),
    );

    expect(sam).toMatchObject({
      player_name: "Sam",
      points: 0,
      assists: 1,
      moments: [
        {
          kind: "assist",
          fixture_id: "fixture_1",
          opponent_team_id: "team_2",
          timing_label: "2nd Quarter",
        },
      ],
    });
  });
});
