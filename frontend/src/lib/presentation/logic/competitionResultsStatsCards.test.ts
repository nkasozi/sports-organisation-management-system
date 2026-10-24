import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import { create_score_award_resolver } from "$lib/core/entities/SportEventCatalog";
import type { Team } from "$lib/core/entities/Team";

import { build_card_stat_categories } from "./competitionResultsCardStats";
import { calculate_player_stats } from "./competitionResultsStats";

const FOOTBALL_CARD_CATEGORIES = build_card_stat_categories({
  card_types: [
    { id: "yellow_card", name: "Yellow Card" },
    { id: "red_card", name: "Red Card" },
  ],
  card_type_colors: [],
  card_weights: new Map(),
});

const BASKETBALL_CARD_CATEGORIES = build_card_stat_categories({
  card_types: [
    { id: "technical_foul", name: "Technical Foul" },
    { id: "flagrant_foul", name: "Flagrant Foul" },
  ],
  card_type_colors: [],
  card_weights: new Map(),
});

function create_test_team(overrides: { id: string; name: string }): Team {
  return overrides as unknown as Team;
}

function create_test_fixture(overrides: {
  game_events: Record<string, unknown>[];
}): Fixture {
  return {
    id: "fixture_1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    ...overrides,
  } as unknown as Fixture;
}

describe("calculate_player_stats card counts", () => {
  it("counts the sport's own card types such as a technical foul", () => {
    const team_map = new Map<string, Team>([
      ["team_1", create_test_team({ id: "team_1", name: "Falcons" })],
    ]);
    const card_event = {
      id: "event_1",
      event_type: "technical_foul",
      minute: 5,
      stoppage_time_minute: 0,
      team_side: "home" as const,
      player_name: "Alex",
      secondary_player_name: "",
      description: "Technical foul",
      recorded_at: "2024-06-01T10:05:00.000Z",
    };
    const fixtures = [
      create_test_fixture({
        game_events: [
          card_event,
          { ...card_event, id: "event_2", event_type: "yellow_card" },
        ],
      }),
    ];

    expect(
      calculate_player_stats(
        fixtures,
        team_map,
        create_score_award_resolver([]),
        BASKETBALL_CARD_CATEGORIES,
      )[0].card_counts,
    ).toEqual({ technical_foul: 1 });
  });

  it("counts a second yellow as a red card for football", () => {
    const team_map = new Map<string, Team>();
    const fixtures = [
      create_test_fixture({
        game_events: [
          {
            id: "event_1",
            event_type: "second_yellow",
            minute: 70,
            stoppage_time_minute: 0,
            team_side: "away",
            player_name: "Jordan",
            secondary_player_name: "",
            description: "Second yellow",
            recorded_at: "2024-06-01T11:10:00.000Z",
          },
        ],
      }),
    ];

    expect(
      calculate_player_stats(
        fixtures,
        team_map,
        create_score_award_resolver([]),
        FOOTBALL_CARD_CATEGORIES,
      )[0].card_counts,
    ).toEqual({ red_card: 1 });
  });
});
