import { type CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import type { FixtureLineupCreateDependencies } from "$lib/presentation/logic/fixtureLineupCreateData";
import { load_fixture_lineup_create_team_data } from "$lib/presentation/logic/fixtureLineupCreateData";
import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "$lib/presentation/logic/fixtureLineupCreatePageContracts";
import {
  create_missing_fixture_lineup_create_fixture_state,
  create_missing_fixture_lineup_create_organization_state,
  create_missing_fixture_lineup_create_team_state,
  resolve_fixture_lineup_create_organization_state,
} from "$lib/presentation/logic/fixtureLineupCreatePageContracts";

export { handle_fixture_lineup_create_fixture_change } from "./fixtureLineupCreatePageFlowFixtureChange";

export function reset_fixture_lineup_create_team_state(): {
  form_data: Partial<CreateFixtureLineupInput>;
  selected_team_state: FixtureLineupCreateTeamState;
  team_players: TeamPlayer[];
  available_teams: Team[];
} {
  return {
    form_data: { team_id: "", selected_players: [] },
    selected_team_state: create_missing_fixture_lineup_create_team_state(),
    team_players: [],
    available_teams: [],
  };
}

export function handle_fixture_lineup_create_organization_change(command: {
  organization_id: string;
  organizations: Organization[];
}): {
  form_data: Partial<CreateFixtureLineupInput>;
  error_message: string;
  validation_errors: Record<string, string>;
  selected_organization_state: FixtureLineupCreateOrganizationState;
  selected_fixture_state: FixtureLineupCreateFixtureState;
  current_step_index: number;
} {
  return {
    form_data: {
      organization_id: command.organization_id,
      fixture_id: "",
      team_id: "",
      selected_players: [],
    },
    error_message: "",
    validation_errors: {},
    selected_organization_state: command.organization_id
      ? resolve_fixture_lineup_create_organization_state(
          command.organization_id,
          command.organizations,
        )
      : create_missing_fixture_lineup_create_organization_state(),
    selected_fixture_state:
      create_missing_fixture_lineup_create_fixture_state(),
    current_step_index: 0,
  };
}

export async function handle_fixture_lineup_create_team_change(command: {
  team_id: string;
  selected_fixture_state: FixtureLineupCreateFixtureState;
  current_auth_profile_state: FixtureLineupCreateAuthProfileState;
  max_players: number;
  dependencies: FixtureLineupCreateDependencies;
}): Promise<{
  selected_team_state: FixtureLineupCreateTeamState;
  team_players: TeamPlayer[];
  selected_players: CreateFixtureLineupInput["selected_players"];
  validation_error: string;
}> {
  if (!command.team_id) {
    return {
      selected_team_state: create_missing_fixture_lineup_create_team_state(),
      team_players: [],
      selected_players: [],
      validation_error: "",
    };
  }
  const result = await load_fixture_lineup_create_team_data(
    command.team_id,
    command.selected_fixture_state,
    command.current_auth_profile_state,
    command.max_players,
    command.dependencies,
  );
  return {
    selected_team_state: result.selected_team_state,
    team_players: result.team_players,
    selected_players: result.selected_players,
    validation_error: result.validation_error,
  };
}
