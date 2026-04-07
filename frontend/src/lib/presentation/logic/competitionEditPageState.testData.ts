import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Team } from "$lib/core/entities/Team";

export function create_test_competition(
  overrides: Partial<Competition>,
): Competition {
  return {
    id: overrides.id ?? "competition_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Premier Cup",
    description: overrides.description ?? "Regional competition",
    organization_id: overrides.organization_id ?? "organization_1",
    competition_format_id: overrides.competition_format_id ?? "format_1",
    team_ids: overrides.team_ids ?? ["team_1"],
    allow_auto_squad_submission: overrides.allow_auto_squad_submission ?? false,
    squad_generation_strategy:
      overrides.squad_generation_strategy ?? "first_available",
    allow_auto_fixture_details_setup:
      overrides.allow_auto_fixture_details_setup ?? false,
    lineup_submission_deadline_hours:
      overrides.lineup_submission_deadline_hours ?? 0,
    start_date: overrides.start_date ?? "2024-06-01",
    end_date: overrides.end_date ?? "2024-06-30",
    registration_deadline: overrides.registration_deadline ?? "2024-05-20",
    max_teams: overrides.max_teams ?? 8,
    entry_fee: overrides.entry_fee ?? 25,
    prize_pool: overrides.prize_pool ?? 1000,
    location: overrides.location ?? "Main Stadium",
    rule_overrides: overrides.rule_overrides ?? {},
    status: overrides.status ?? "active",
  };
}

export function create_test_team(overrides: Partial<Team>): Team {
  return {
    id: overrides.id ?? "team_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Falcons",
    short_name: overrides.short_name ?? "FAL",
    description: overrides.description ?? "",
    organization_id: overrides.organization_id ?? "organization_1",
    gender_id: overrides.gender_id ?? "gender_1",
    captain_player_id: overrides.captain_player_id ?? null,
    vice_captain_player_id: overrides.vice_captain_player_id ?? null,
    max_squad_size: overrides.max_squad_size ?? 18,
    home_venue_id: overrides.home_venue_id ?? "venue_1",
    primary_color: overrides.primary_color ?? "#123456",
    secondary_color: overrides.secondary_color ?? "#FFFFFF",
    logo_url: overrides.logo_url ?? "",
    website: overrides.website ?? "",
    founded_year: overrides.founded_year ?? 2001,
    status: overrides.status ?? "active",
  };
}

export function create_test_competition_team(
  overrides: Partial<CompetitionTeam>,
): CompetitionTeam {
  return {
    id: overrides.id ?? "competition_team_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    competition_id: overrides.competition_id ?? "competition_1",
    team_id: overrides.team_id ?? "team_1",
    registration_date: overrides.registration_date ?? "2024-05-10",
    seed_number: overrides.seed_number ?? null,
    group_name: overrides.group_name ?? null,
    points: overrides.points ?? 0,
    goals_for: overrides.goals_for ?? 0,
    goals_against: overrides.goals_against ?? 0,
    goal_difference: overrides.goal_difference ?? 0,
    matches_played: overrides.matches_played ?? 0,
    matches_won: overrides.matches_won ?? 0,
    matches_drawn: overrides.matches_drawn ?? 0,
    matches_lost: overrides.matches_lost ?? 0,
    notes: overrides.notes ?? "",
    status: overrides.status ?? "registered",
  };
}
