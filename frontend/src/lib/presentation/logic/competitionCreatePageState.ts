import type { SquadGenerationStrategy } from "$lib/core/entities/Competition";
import { type CreateCompetitionInput } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import type { CreateCompetitionTeamInput } from "$lib/core/entities/CompetitionTeam";
import { create_empty_competition_team_input } from "$lib/core/entities/CompetitionTeam";

export type CompetitionCreateSelectedFormatState =
  | { status: "missing" }
  | { status: "present"; competition_format: CompetitionFormat };

const DEFAULT_SQUAD_GENERATION_STRATEGY: SquadGenerationStrategy =
  "first_available";

export function get_next_selected_team_ids(
  selected_team_ids: Set<string>,
  team_id: string,
): Set<string> {
  const next_selected_team_ids = new Set(selected_team_ids);
  if (next_selected_team_ids.has(team_id)) {
    next_selected_team_ids.delete(team_id);
    return next_selected_team_ids;
  }
  next_selected_team_ids.add(team_id);
  return next_selected_team_ids;
}

export function get_competition_format_team_requirements(
  selected_format_state: CompetitionCreateSelectedFormatState,
): string {
  if (selected_format_state.status === "missing") return "";

  return `Requires ${selected_format_state.competition_format.min_teams_required} to ${selected_format_state.competition_format.max_teams_allowed} teams`;
}

export function is_competition_team_count_valid(
  selected_format_state: CompetitionCreateSelectedFormatState,
  selected_team_count: number,
): boolean {
  if (selected_format_state.status === "missing") return true;

  return (
    selected_team_count >=
      selected_format_state.competition_format.min_teams_required &&
    selected_team_count <=
      selected_format_state.competition_format.max_teams_allowed
  );
}

export function update_competition_auto_squad_submission(
  form_data: CreateCompetitionInput,
  enabled: boolean,
): CreateCompetitionInput {
  return {
    ...form_data,
    allow_auto_squad_submission: enabled,
    lineup_submission_deadline_hours: enabled
      ? form_data.lineup_submission_deadline_hours
      : 0,
  };
}

export function normalize_competition_auto_squad_settings(
  form_data: CreateCompetitionInput,
): CreateCompetitionInput {
  let next_form_data = form_data;

  if (
    form_data.lineup_submission_deadline_hours > 0 &&
    !form_data.allow_auto_squad_submission
  ) {
    next_form_data = { ...next_form_data, allow_auto_squad_submission: true };
  }

  if (
    next_form_data.allow_auto_squad_submission &&
    !next_form_data.squad_generation_strategy
  ) {
    next_form_data = {
      ...next_form_data,
      squad_generation_strategy: DEFAULT_SQUAD_GENERATION_STRATEGY,
    };
  }

  return next_form_data;
}

export function create_competition_team_inputs(
  competition_id: string,
  team_ids: string[],
  registration_date: string,
): CreateCompetitionTeamInput[] {
  return team_ids.map((team_id: string) => {
    const competition_team_input = create_empty_competition_team_input(
      competition_id,
      team_id,
    );
    competition_team_input.registration_date = registration_date;
    return competition_team_input;
  });
}
