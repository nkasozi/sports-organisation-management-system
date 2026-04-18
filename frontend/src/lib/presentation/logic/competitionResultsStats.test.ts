import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

import {
  calculate_player_stats,
  derive_stats_available_teams,
  filter_and_sort_card_players,
  filter_and_sort_scorers,
} from "./competitionResultsStats";

function create_test_team(overrides: Partial<ScalarInput<Team>> = {}): Team {
  return {
    id: overrides.id ?? "team_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Falcons",
    short_name: overrides.short_name ?? "FAL",
    description: overrides.description ?? "",
    organization_id: overrides.organization_id ?? "organization_1",
    gender_id: overrides.gender_id ?? "gender_1",
    captain_player_id: overrides.captain_player_id ?? "",
    vice_captain_player_id: overrides.vice_captain_player_id ?? "",
    max_squad_size: overrides.max_squad_size ?? 18,
    home_venue_id: overrides.home_venue_id ?? "venue_1",
    primary_color: overrides.primary_color ?? "#123456",
    secondary_color: overrides.secondary_color ?? "#FFFFFF",
    logo_url: overrides.logo_url ?? "",
    website: overrides.website ?? "",
    founded_year: overrides.founded_year ?? 2001,
    status: overrides.status ?? "active",
  } as unknown as Team;
}

function create_test_fixture(
  overrides: Partial<ScalarInput<Fixture>> = {},
): Fixture {
  return {
    id: overrides.id ?? "fixture_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    organization_id: overrides.organization_id ?? "organization_1",
    competition_id: overrides.competition_id ?? "competition_1",
    round_number: overrides.round_number ?? 1,
    round_name: overrides.round_name ?? "Round 1",
    home_team_id: overrides.home_team_id ?? "team_1",
    away_team_id: overrides.away_team_id ?? "team_2",
    venue: overrides.venue ?? "Main Stadium",
    scheduled_date: overrides.scheduled_date ?? "2024-06-01T10:00:00.000Z",
    scheduled_time: overrides.scheduled_time ?? "10:00",
    home_team_score: overrides.home_team_score ?? 1,
    away_team_score: overrides.away_team_score ?? 0,
    assigned_officials: overrides.assigned_officials ?? [],
    game_events: overrides.game_events ?? [],
    current_period: overrides.current_period ?? "finished",
    current_minute: overrides.current_minute ?? 90,
    match_day: overrides.match_day ?? 1,
    notes: overrides.notes ?? "",
    stage_id: overrides.stage_id ?? "stage_1",
    status: overrides.status ?? "completed",
    home_team_name: overrides.home_team_name,
    away_team_name: overrides.away_team_name,
    home_team_jersey: overrides.home_team_jersey,
    away_team_jersey: overrides.away_team_jersey,
    officials_jersey: overrides.officials_jersey,
    manual_importance_override: overrides.manual_importance_override,
  } as unknown as Fixture;
}

describe("calculate_player_stats", () => {
  it("aggregates goals and cards by player and team", () => {
    const team_map = new Map<string, Team>([
      ["team_1", create_test_team({ id: "team_1", name: "Falcons" })],
      ["team_2", create_test_team({ id: "team_2", name: "Wolves" })],
    ]);
    const fixtures = [
      create_test_fixture({
        game_events: [
          {
            id: "event_1",
            event_type: "goal",
            minute: 12,
            stoppage_time_minute: 0,
            team_side: "home",
            player_name: "Alex",
            secondary_player_name: "",
            description: "Goal",
            recorded_at: "2024-06-01T10:12:00.000Z",
          },
          {
            id: "event_2",
            event_type: "penalty_scored",
            minute: 48,
            stoppage_time_minute: 0,
            team_side: "home",
            player_name: "Alex",
            secondary_player_name: "",
            description: "Penalty",
            recorded_at: "2024-06-01T10:48:00.000Z",
          },
          {
            id: "event_3",
            event_type: "yellow_card",
            minute: 65,
            stoppage_time_minute: 0,
            team_side: "away",
            player_name: "Jordan",
            secondary_player_name: "",
            description: "Yellow card",
            recorded_at: "2024-06-01T11:05:00.000Z",
          },
        ],
      }),
    ];

    expect(calculate_player_stats(fixtures, team_map)).toEqual([
      {
        player_name: "Alex",
        team_name: "Falcons",
        goals: 2,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
      },
      {
        player_name: "Jordan",
        team_name: "Wolves",
        goals: 0,
        assists: 0,
        yellow_cards: 1,
        red_cards: 0,
      },
    ]);
  });
});

describe("competition results stats filters", () => {
  const player_stats = [
    {
      player_name: "Alex",
      team_name: "Falcons",
      goals: 4,
      assists: 0,
      yellow_cards: 1,
      red_cards: 0,
    },
    {
      player_name: "Sam",
      team_name: "Wolves",
      goals: 2,
      assists: 0,
      yellow_cards: 0,
      red_cards: 1,
    },
    {
      player_name: "Jamie",
      team_name: "Falcons",
      goals: 0,
      assists: 0,
      yellow_cards: 3,
      red_cards: 0,
    },
  ];

  it("derives sorted unique team names", () => {
    expect(derive_stats_available_teams(player_stats)).toEqual([
      "Falcons",
      "Wolves",
    ]);
  });

  it("filters and sorts top scorers by team", () => {
    expect(filter_and_sort_scorers(player_stats, "Falcons")).toEqual([
      player_stats[0],
    ]);
  });

  it("sorts card players by total cards", () => {
    expect(filter_and_sort_card_players(player_stats, "all", "total")).toEqual([
      player_stats[2],
      player_stats[1],
      player_stats[0],
    ]);
  });

  it("sorts card players by red cards", () => {
    expect(filter_and_sort_card_players(player_stats, "all", "red")[0]).toBe(
      player_stats[1],
    );
  });
});
