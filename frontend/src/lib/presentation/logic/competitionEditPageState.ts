import type {
  Competition,
  SquadGenerationStrategy,
  UpdateCompetitionInput,
} from "$lib/core/entities/Competition";
import type { TieBreaker } from "$lib/core/entities/CompetitionFormat";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Team } from "$lib/core/entities/Team";

const DEFAULT_SQUAD_GENERATION_STRATEGY: SquadGenerationStrategy =
  "first_available";

interface CompetitionTeamCollections {
  available_teams: Team[];
  competition_team_entries: CompetitionTeam[];
  teams_in_competition: Team[];
}

export function create_competition_update_form_data(
  competition: Competition,
): UpdateCompetitionInput {
  return {
    name: competition.name,
    description: competition.description,
    organization_id: competition.organization_id,
    competition_format_id: competition.competition_format_id,
    team_ids: competition.team_ids,
    allow_auto_squad_submission: competition.allow_auto_squad_submission,
    squad_generation_strategy: competition.squad_generation_strategy,
    allow_auto_fixture_details_setup:
      competition.allow_auto_fixture_details_setup,
    lineup_submission_deadline_hours:
      competition.lineup_submission_deadline_hours,
    start_date: competition.start_date,
    end_date: competition.end_date,
    registration_deadline: competition.registration_deadline,
    max_teams: competition.max_teams,
    entry_fee: competition.entry_fee,
    prize_pool: competition.prize_pool,
    location: competition.location,
    rule_overrides: competition.rule_overrides,
    status: competition.status,
  };
}

export function create_competition_team_collections(
  all_teams: Team[],
  competition_team_entries: CompetitionTeam[],
  organization_id: string,
): CompetitionTeamCollections {
  const registered_team_ids = new Set(
    competition_team_entries.map(
      (competition_team_entry: CompetitionTeam) =>
        competition_team_entry.team_id,
    ),
  );
  const organization_teams = all_teams.filter(
    (team: Team) => team.organization_id === organization_id,
  );

  return {
    competition_team_entries,
    teams_in_competition: all_teams.filter((team: Team) =>
      registered_team_ids.has(team.id),
    ),
    available_teams: organization_teams.filter(
      (team: Team) => !registered_team_ids.has(team.id),
    ),
  };
}

export function get_competition_team_collections_after_add(
  collections: CompetitionTeamCollections,
  competition_team_entry: CompetitionTeam,
  team: Team,
): CompetitionTeamCollections {
  return {
    competition_team_entries: [
      ...collections.competition_team_entries,
      competition_team_entry,
    ],
    teams_in_competition: [...collections.teams_in_competition, team],
    available_teams: collections.available_teams.filter(
      (available_team: Team) => available_team.id !== team.id,
    ),
  };
}

export function get_competition_team_collections_after_remove(
  collections: CompetitionTeamCollections,
  team: Team,
): CompetitionTeamCollections {
  return {
    competition_team_entries: collections.competition_team_entries.filter(
      (competition_team_entry: CompetitionTeam) =>
        competition_team_entry.team_id !== team.id,
    ),
    teams_in_competition: collections.teams_in_competition.filter(
      (competition_team: Team) => competition_team.id !== team.id,
    ),
    available_teams: [...collections.available_teams, team],
  };
}

export function update_competition_points_override(
  form_data: UpdateCompetitionInput,
  field: "points_for_win" | "points_for_draw" | "points_for_loss",
  raw_value: string,
): UpdateCompetitionInput {
  const parsed_value = Number.parseInt(raw_value, 10);
  if (Number.isNaN(parsed_value)) return form_data;

  return {
    ...form_data,
    rule_overrides: {
      ...form_data.rule_overrides,
      points_config_override: {
        ...form_data.rule_overrides?.points_config_override,
        [field]: parsed_value,
      },
    },
  };
}

export function toggle_competition_tie_breaker(
  form_data: UpdateCompetitionInput,
  tie_breaker: TieBreaker,
  enabled: boolean,
  format_default_tie_breakers: TieBreaker[],
): UpdateCompetitionInput {
  const current_tie_breakers =
    form_data.rule_overrides?.tie_breakers_override ??
    format_default_tie_breakers;
  const next_tie_breakers = enabled
    ? [...current_tie_breakers, tie_breaker]
    : current_tie_breakers.filter(
        (current_value: TieBreaker) => current_value !== tie_breaker,
      );

  return {
    ...form_data,
    rule_overrides: {
      ...form_data.rule_overrides,
      tie_breakers_override: next_tie_breakers,
    },
  };
}

export function reset_competition_scoring_overrides(
  form_data: UpdateCompetitionInput,
): UpdateCompetitionInput {
  const current_rule_overrides = form_data.rule_overrides ?? {};
  const {
    points_config_override: _ignored_points_config_override,
    tie_breakers_override: _ignored_tie_breakers_override,
    ...remaining_rule_overrides
  } = current_rule_overrides;

  return {
    ...form_data,
    rule_overrides: remaining_rule_overrides,
  };
}

export function normalize_competition_auto_squad_settings(
  form_data: UpdateCompetitionInput,
): UpdateCompetitionInput {
  let next_form_data = form_data;

  if (
    (form_data.lineup_submission_deadline_hours ?? 0) > 0 &&
    !form_data.allow_auto_squad_submission
  ) {
    next_form_data = {
      ...next_form_data,
      allow_auto_squad_submission: true,
    };
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
