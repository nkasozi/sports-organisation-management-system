import { describe, expect, it } from "vitest";

import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

import {
  apply_fixture_to_team_public_profile_stats,
  build_team_public_profile_fixture_display,
  create_empty_team_public_profile_stats,
  format_team_public_profile_date,
} from "./teamPublicProfilePageState";

function create_team(overrides: Partial<ScalarInput<Team>> = {}): Team {
  return {
    id: "team_1",
    name: "Lions",
    short_name: "LIO",
    description: "",
    organization_id: "org_1",
    gender_id: "gender_1",
    captain_player_id: null,
    vice_captain_player_id: null,
    max_squad_size: 25,
    home_venue_id: "venue_1",
    primary_color: "#000000",
    secondary_color: "#FFFFFF",
    logo_url: "",
    website: "",
    founded_year: 2020,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as Team;
}

function create_fixture(overrides: Partial<ScalarInput<Fixture>> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "competition_1",
    round_number: 1,
    round_name: "Round 1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    venue: "Main Stadium",
    scheduled_date: "2026-03-04",
    scheduled_time: "15:00",
    home_team_score: 2,
    away_team_score: 1,
    assigned_officials: [],
    game_events: [
      {
        id: "event_1",
        event_type: "yellow_card",
        minute: 10,
        stoppage_time_minute: null,
        team_side: "home",
        player_name: "Player 1",
        secondary_player_name: "",
        description: "Yellow card",
        recorded_at: "2026-03-04T00:00:00Z",
      },
      {
        id: "event_2",
        event_type: "red_card",
        minute: 80,
        stoppage_time_minute: null,
        team_side: "home",
        player_name: "Player 2",
        secondary_player_name: "",
        description: "Red card",
        recorded_at: "2026-03-04T00:00:00Z",
      },
    ],
    current_period: "finished",
    current_minute: 90,
    match_day: 1,
    notes: "",
    stage_id: "stage_1",
    status: "completed",
    created_at: "2026-03-04T00:00:00Z",
    updated_at: "2026-03-04T00:00:00Z",
    ...overrides,
  } as Fixture;
}

describe("teamPublicProfilePageState", () => {
  it("creates empty team stats", () => {
    expect(create_empty_team_public_profile_stats()).toEqual({
      total_matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      yellow_cards: 0,
      red_cards: 0,
    });
  });

  it("applies a completed fixture to team totals", () => {
    const result = apply_fixture_to_team_public_profile_stats(
      create_empty_team_public_profile_stats(),
      create_fixture(),
      "team_1",
    );

    expect(result.total_matches).toBe(1);
    expect(result.wins).toBe(1);
    expect(result.goals_for).toBe(2);
    expect(result.goals_against).toBe(1);
    expect(result.yellow_cards).toBe(1);
    expect(result.red_cards).toBe(1);
  });

  it("formats fixture dates and fixture labels", () => {
    expect(format_team_public_profile_date("2026-03-04")).toBe("Mar 4, 2026");
    expect(
      build_team_public_profile_fixture_display(
        create_fixture(),
        new Map<string, Team>([
          ["team_1", create_team({ id: "team_1", name: "Lions" })],
          ["team_2", create_team({ id: "team_2", name: "Tigers" })],
        ]),
      ),
    ).toBe("Lions vs Tigers");
  });
});
