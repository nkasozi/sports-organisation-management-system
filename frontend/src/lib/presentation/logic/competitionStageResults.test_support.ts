import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

export function create_team(id: string, name: string): Team {
  return {
    id,
    name,
    short_name: name.slice(0, 3).toUpperCase(),
    description: `${name} description`,
    organization_id: "org-123",
    gender_id: "gender-123",
    captain_player_id: "",
    vice_captain_player_id: "",
    max_squad_size: 25,
    home_venue_id: "venue-123",
    founded_year: 2020,
    primary_color: "Blue",
    secondary_color: "White",
    logo_url: "",
    website: "",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  } as Team;
}

export function create_stage(
  overrides: Partial<CompetitionStage> = {},
): CompetitionStage {
  return {
    id: "stage-1",
    competition_id: "comp-123",
    name: "Pool Stage",
    stage_type: "group_stage",
    stage_order: 1,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as CompetitionStage;
}

export function create_fixture(
  home_team_id: string,
  away_team_id: string,
  overrides: Partial<Fixture> = {},
): Fixture {
  return {
    id: `${home_team_id}-${away_team_id}`,
    organization_id: "org-123",
    competition_id: "comp-123",
    stage_id: "stage-1",
    round_number: 1,
    round_name: "Round 1",
    home_team_id,
    away_team_id,
    venue: "Ground",
    scheduled_date: "2026-04-01",
    scheduled_time: "15:00",
    home_team_score: 1,
    away_team_score: 0,
    assigned_officials: [],
    game_events: [],
    current_period: "pre_game",
    current_minute: 0,
    match_day: 1,
    notes: "",
    status: "completed",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as Fixture;
}
