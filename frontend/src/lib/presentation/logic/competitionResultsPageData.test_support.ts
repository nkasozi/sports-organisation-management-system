import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "$lib/core/entities/CompetitionFormatFactories";

export function create_test_competition(
  overrides: Partial<Competition>,
): Competition {
  return {
    id: overrides.id ?? "competition_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Premier Cup",
    description: overrides.description ?? "",
    organization_id: overrides.organization_id ?? "organization_1",
    competition_format_id: overrides.competition_format_id ?? "format_1",
    team_ids: overrides.team_ids ?? [],
    allow_auto_squad_submission: overrides.allow_auto_squad_submission ?? false,
    squad_generation_strategy:
      overrides.squad_generation_strategy ?? "first_available",
    allow_auto_fixture_details_setup:
      overrides.allow_auto_fixture_details_setup ?? false,
    lineup_submission_deadline_hours:
      overrides.lineup_submission_deadline_hours ?? 0,
    max_event_edits_per_game: overrides.max_event_edits_per_game ?? 3,
    start_date: overrides.start_date ?? "2024-06-01",
    end_date: overrides.end_date ?? "2024-06-30",
    registration_deadline: overrides.registration_deadline ?? "2024-05-20",
    max_teams: overrides.max_teams ?? 8,
    entry_fee: overrides.entry_fee ?? 0,
    prize_pool: overrides.prize_pool ?? 0,
    location: overrides.location ?? "Main Stadium",
    rule_overrides: overrides.rule_overrides ?? {},
    status: overrides.status ?? "active",
  } as Competition;
}

export function create_test_competition_format(
  overrides: Partial<CompetitionFormat>,
): CompetitionFormat {
  return {
    id: overrides.id ?? "format_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "League",
    code: overrides.code ?? "LEAGUE",
    description: overrides.description ?? "",
    format_type: overrides.format_type ?? "league",
    points_config: overrides.points_config ?? {
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
    },
    tie_breakers: overrides.tie_breakers ?? ["goal_difference"],
    group_stage_config:
      overrides.group_stage_config ?? create_default_group_stage_config(),
    knockout_stage_config:
      overrides.knockout_stage_config ?? create_default_knockout_stage_config(),
    league_config: overrides.league_config ?? create_default_league_config(),
    stage_templates: overrides.stage_templates ?? [],
    min_teams_required: overrides.min_teams_required ?? 4,
    max_teams_allowed: overrides.max_teams_allowed ?? 16,
    status: overrides.status ?? "active",
    organization_id: overrides.organization_id,
  } as CompetitionFormat;
}
