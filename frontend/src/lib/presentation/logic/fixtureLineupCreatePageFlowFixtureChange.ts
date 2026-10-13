import { type CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import { determine_step_after_team_auto_selected } from "$lib/core/services/fixtureLineupWizard";
import type { FixtureLineupCreateDependencies } from "$lib/presentation/logic/fixtureLineupCreateData";
import { load_fixture_lineup_create_fixture_data } from "$lib/presentation/logic/fixtureLineupCreateData";
import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateOrganizationState,
} from "$lib/presentation/logic/fixtureLineupCreatePageContracts";
import {
  create_missing_fixture_lineup_create_fixture_state,
  create_missing_fixture_lineup_create_organization_state,
  create_present_fixture_lineup_create_fixture_state,
  resolve_fixture_lineup_create_organization_state,
} from "$lib/presentation/logic/fixtureLineupCreatePageContracts";

import {
  FIXTURE_DATA_FAILURE_REASON,
  type FixtureDataFailure,
} from "./fixtureLineupCreateDataFixtureLoaders";
import { DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS } from "./fixtureLineupCreateDataFixtureRules";
import type { FixtureLineupCreateFixtureData } from "./fixtureLineupCreateDataTypes";

interface FixtureChangeCommand {
  fixture_id: string;
  current_auth_profile_state: FixtureLineupCreateAuthProfileState;
  organizations: Organization[];
  dependencies: FixtureLineupCreateDependencies;
  fixtures_with_complete_lineups: Set<string>;
  team_players_count: number;
}

interface FixtureChangeResult {
  success: boolean;
  error_message: string;
  form_data: Partial<CreateFixtureLineupInput>;
  selected_fixture_state: FixtureLineupCreateFixtureState;
  selected_organization_state: FixtureLineupCreateOrganizationState;
  min_players: number;
  max_players: number;
  starters_count: number;
  available_teams: Team[];
  fixture_team_label_by_team_id: Map<string, string>;
  teams_with_existing_lineups: Map<string, string>;
  current_step_index: number;
  auto_selected_team_id: string;
  fixtures_with_complete_lineups: Set<string>;
}

function build_unselected_fixture_change_result(
  success: boolean,
  error_message: string,
  fixture_id: string,
  fixtures_with_complete_lineups: Set<string>,
): FixtureChangeResult {
  return {
    success,
    error_message,
    form_data: { fixture_id, team_id: "", selected_players: [] },
    selected_fixture_state:
      create_missing_fixture_lineup_create_fixture_state(),
    selected_organization_state:
      create_missing_fixture_lineup_create_organization_state(),
    ...DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS,
    available_teams: [],
    fixture_team_label_by_team_id: new Map(),
    teams_with_existing_lineups: new Map(),
    current_step_index: 1,
    auto_selected_team_id: "",
    fixtures_with_complete_lineups,
  };
}

function resolve_fixtures_with_complete_lineups(
  command: FixtureChangeCommand,
  failure: FixtureDataFailure,
): Set<string> {
  switch (failure.failure_reason) {
    case FIXTURE_DATA_FAILURE_REASON.ALL_TEAMS_SUBMITTED:
      return new Set([
        ...command.fixtures_with_complete_lineups,
        command.fixture_id,
      ]);
    case FIXTURE_DATA_FAILURE_REASON.FIXTURE_UNAVAILABLE:
    case FIXTURE_DATA_FAILURE_REASON.COMPETITION_UNAVAILABLE:
    case FIXTURE_DATA_FAILURE_REASON.TEAM_ALREADY_SUBMITTED:
      return command.fixtures_with_complete_lineups;
  }
}

function build_failed_fixture_change_result(
  command: FixtureChangeCommand,
  failure: FixtureDataFailure,
): FixtureChangeResult {
  return build_unselected_fixture_change_result(
    false,
    failure.error_message,
    failure.should_clear_fixture ? "" : command.fixture_id,
    resolve_fixtures_with_complete_lineups(command, failure),
  );
}

function build_loaded_fixture_change_result(
  command: FixtureChangeCommand,
  data: FixtureLineupCreateFixtureData,
): FixtureChangeResult {
  return {
    success: true,
    error_message: "",
    form_data: {
      fixture_id: command.fixture_id,
      organization_id: data.organization_id,
      team_id: "",
      selected_players: [],
    },
    selected_fixture_state: create_present_fixture_lineup_create_fixture_state(
      data.selected_fixture,
    ),
    selected_organization_state:
      resolve_fixture_lineup_create_organization_state(
        data.organization_id,
        command.organizations,
      ),
    min_players: data.min_players,
    max_players: data.max_players,
    starters_count: data.starters_count,
    available_teams: data.available_teams,
    fixture_team_label_by_team_id: data.fixture_team_label_by_team_id,
    teams_with_existing_lineups: data.teams_with_existing_lineups,
    current_step_index: data.auto_selected_team_id
      ? determine_step_after_team_auto_selected({
          has_selected_team: true,
          team_players_count: command.team_players_count,
        })
      : 2,
    auto_selected_team_id: data.auto_selected_team_id,
    fixtures_with_complete_lineups: command.fixtures_with_complete_lineups,
  };
}

export async function handle_fixture_lineup_create_fixture_change(
  command: FixtureChangeCommand,
): Promise<FixtureChangeResult> {
  if (!command.fixture_id)
    return build_unselected_fixture_change_result(
      true,
      "",
      "",
      command.fixtures_with_complete_lineups,
    );
  const result = await load_fixture_lineup_create_fixture_data(
    command.fixture_id,
    command.current_auth_profile_state,
    command.dependencies,
  );
  if (!result.success)
    return build_failed_fixture_change_result(command, result);
  return build_loaded_fixture_change_result(command, result.data);
}
