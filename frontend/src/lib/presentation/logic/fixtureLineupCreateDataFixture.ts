import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import { get_authorization_preselect_values } from "$lib/core/interfaces/ports";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import { build_fixture_team_label_map } from "$lib/presentation/logic/fixtureLineupCreateState";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  create_fixture_data_failure,
  FIXTURE_DATA_FAILURE_REASON,
  type FixtureDataStep,
  type FixtureRelatedRecords,
  load_fixture_competition,
  load_fixture_related_records,
  load_scheduled_fixture,
  resolve_fixture_player_limits,
} from "./fixtureLineupCreateDataFixtureLoaders";
import {
  build_teams_with_existing_lineups,
  collect_fixture_teams,
  type FixtureLineupPlayerLimits,
  resolve_auto_selected_team_id,
} from "./fixtureLineupCreateDataFixtureRules";
import type {
  FixtureLineupCreateDependencies,
  FixtureLineupCreateFixtureData,
} from "./fixtureLineupCreateDataTypes";
import type { FixtureLineupCreateAuthProfileState } from "./fixtureLineupCreatePageContracts";

interface FixtureTeamContext {
  teams: Team[];
  available_teams: Team[];
  competition_teams_for_fixture: FixtureLineupCreateFixtureData["competition_teams_for_fixture"];
  fixture_team_label_by_team_id: Map<string, string>;
  teams_with_existing_lineups: Map<string, string>;
}

function build_fixture_team_context(
  related_records: FixtureRelatedRecords,
): FixtureTeamContext {
  const teams = collect_fixture_teams([
    related_records.home_team,
    related_records.away_team,
  ]);
  const competition_teams_result = related_records.competition_teams;
  const competition_teams_for_fixture =
    competition_teams_result.success && competition_teams_result.data
      ? competition_teams_result.data.items
      : [];
  const fixture_team_label_by_team_id = build_fixture_team_label_map(
    teams,
    competition_teams_for_fixture,
  );
  const lineups_result = related_records.lineups;
  const teams_with_existing_lineups = build_teams_with_existing_lineups(
    lineups_result.success && lineups_result.data
      ? lineups_result.data.items
      : [],
    teams,
    fixture_team_label_by_team_id,
  );
  const available_teams = teams.filter(
    (team: Team) => !teams_with_existing_lineups.has(team.id),
  );
  return {
    teams,
    available_teams,
    competition_teams_for_fixture,
    fixture_team_label_by_team_id,
    teams_with_existing_lineups,
  };
}

function find_team_availability_failure(
  team_context: FixtureTeamContext,
  competition: Competition,
  preselected_team: Option<string>,
): FixtureDataStep<boolean> {
  if (
    team_context.available_teams.length === 0 &&
    team_context.teams.length > 0
  )
    return create_fixture_data_failure(
      "All teams have already submitted lineups for this fixture.",
      `"${competition.name}" already has lineups from all participating teams.`,
      "Select a different fixture that still needs team lineups.",
      true,
      FIXTURE_DATA_FAILURE_REASON.ALL_TEAMS_SUBMITTED,
    );
  if (
    preselected_team.status === OptionStatus.SOME &&
    team_context.teams_with_existing_lineups.has(preselected_team.value)
  )
    return create_fixture_data_failure(
      "Your team has already submitted a lineup for this fixture.",
      "Each team can only submit one lineup per fixture.",
      "Select a different fixture or view your existing lineup.",
      true,
      FIXTURE_DATA_FAILURE_REASON.TEAM_ALREADY_SUBMITTED,
    );
  return { success: true, data: true };
}

function build_fixture_data_result(
  selected_fixture: FixtureLineupCreateFixtureData["selected_fixture"],
  competition: Competition,
  limits: FixtureLineupPlayerLimits,
  team_context: FixtureTeamContext,
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
): FixtureDataStep<FixtureLineupCreateFixtureData> {
  const preselect_values =
    current_auth_profile_state.status === PRESENCE_STATUS.PRESENT
      ? get_authorization_preselect_values(current_auth_profile_state.profile)
      : {};
  const preselected_team: Option<string> = preselect_values.team_id
    ? create_some_option(preselect_values.team_id)
    : create_none_option();
  const availability_step = find_team_availability_failure(
    team_context,
    competition,
    preselected_team,
  );
  if (!availability_step.success) return availability_step;
  return {
    success: true,
    data: {
      selected_fixture,
      organization_id: competition.organization_id,
      ...limits,
      ...team_context,
      auto_selected_team_id: resolve_auto_selected_team_id(
        preselected_team,
        team_context.available_teams,
      ),
    },
  };
}

export async function load_fixture_lineup_create_fixture_data(
  fixture_id: string,
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureDataStep<FixtureLineupCreateFixtureData>> {
  const fixture_step = await load_scheduled_fixture(fixture_id, dependencies);
  if (!fixture_step.success) return fixture_step;
  const selected_fixture = fixture_step.data;
  const competition_step = await load_fixture_competition(
    selected_fixture,
    dependencies,
  );
  if (!competition_step.success) return competition_step;
  const competition = competition_step.data;
  const related_records = await load_fixture_related_records(
    fixture_id,
    selected_fixture,
    competition,
    dependencies,
  );
  const limits = await resolve_fixture_player_limits(
    related_records.organization,
    competition,
  );
  return build_fixture_data_result(
    selected_fixture,
    competition,
    limits,
    build_fixture_team_context(related_records),
    current_auth_profile_state,
  );
}
