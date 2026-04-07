import type { Fixture } from "$lib/core/entities/Fixture";
import { type CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import { type UserScopeProfile } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import { determine_step_after_team_auto_selected } from "$lib/core/services/fixtureLineupWizard";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import type { FixtureLineupCreateDependencies } from "$lib/presentation/logic/fixtureLineupCreateData";
import {
  load_fixture_lineup_create_fixture_data,
  load_fixture_lineup_create_team_data,
} from "$lib/presentation/logic/fixtureLineupCreateData";

export function reset_fixture_lineup_create_team_state(): {
  form_data: Partial<CreateFixtureLineupInput>;
  selected_team: Team | null;
  team_players: TeamPlayer[];
  available_teams: Team[];
} {
  return {
    form_data: { team_id: "", selected_players: [] },
    selected_team: null,
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
  selected_organization: Organization | null;
  selected_fixture: Fixture | null;
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
    selected_organization: command.organization_id
      ? command.organizations.find(
          (organization: Organization) =>
            organization.id === command.organization_id,
        ) || null
      : null,
    selected_fixture: null,
    current_step_index: 0,
  };
}

export async function handle_fixture_lineup_create_fixture_change(command: {
  fixture_id: string;
  current_auth_profile: UserScopeProfile | null;
  organizations: Organization[];
  dependencies: FixtureLineupCreateDependencies;
  fixtures_with_complete_lineups: Set<string>;
  team_players_count: number;
}): Promise<{
  success: boolean;
  error_message: string;
  form_data: Partial<CreateFixtureLineupInput>;
  selected_fixture: Fixture | null;
  selected_organization: Organization | null;
  min_players: number;
  max_players: number;
  starters_count: number;
  available_teams: Team[];
  fixture_team_label_by_team_id: Map<string, string>;
  teams_with_existing_lineups: Map<string, string>;
  current_step_index: number;
  auto_selected_team_id: string;
  fixtures_with_complete_lineups: Set<string>;
}> {
  if (!command.fixture_id) {
    return {
      success: true,
      error_message: "",
      form_data: { fixture_id: "", team_id: "", selected_players: [] },
      selected_fixture: null,
      selected_organization: null,
      min_players: 2,
      max_players: 18,
      starters_count: 11,
      available_teams: [],
      fixture_team_label_by_team_id: new Map(),
      teams_with_existing_lineups: new Map(),
      current_step_index: 1,
      auto_selected_team_id: "",
      fixtures_with_complete_lineups: command.fixtures_with_complete_lineups,
    };
  }
  const result = await load_fixture_lineup_create_fixture_data(
    command.fixture_id,
    command.current_auth_profile,
    command.dependencies,
  );
  if (!result.success) {
    return {
      success: false,
      error_message: result.error_message,
      form_data: {
        fixture_id: result.should_clear_fixture ? "" : command.fixture_id,
        team_id: "",
        selected_players: [],
      },
      selected_fixture: null,
      selected_organization: null,
      min_players: 2,
      max_players: 18,
      starters_count: 11,
      available_teams: [],
      fixture_team_label_by_team_id: new Map(),
      teams_with_existing_lineups: new Map(),
      current_step_index: 1,
      auto_selected_team_id: "",
      fixtures_with_complete_lineups: result.error_message.includes(
        "All teams have already submitted",
      )
        ? new Set([
            ...command.fixtures_with_complete_lineups,
            command.fixture_id,
          ])
        : command.fixtures_with_complete_lineups,
    };
  }
  return {
    success: true,
    error_message: "",
    form_data: {
      fixture_id: command.fixture_id,
      organization_id: result.data.organization_id,
      team_id: "",
      selected_players: [],
    },
    selected_fixture: result.data.selected_fixture,
    selected_organization:
      command.organizations.find(
        (organization: Organization) =>
          organization.id === result.data.organization_id,
      ) || null,
    min_players: result.data.min_players,
    max_players: result.data.max_players,
    starters_count: result.data.starters_count,
    available_teams: result.data.available_teams,
    fixture_team_label_by_team_id: result.data.fixture_team_label_by_team_id,
    teams_with_existing_lineups: result.data.teams_with_existing_lineups,
    current_step_index: result.data.auto_selected_team_id
      ? determine_step_after_team_auto_selected({
          has_selected_team: true,
          team_players_count: command.team_players_count,
        })
      : 2,
    auto_selected_team_id: result.data.auto_selected_team_id,
    fixtures_with_complete_lineups: command.fixtures_with_complete_lineups,
  };
}

export async function handle_fixture_lineup_create_team_change(command: {
  team_id: string;
  selected_fixture: Fixture | null;
  current_auth_profile: UserScopeProfile | null;
  max_players: number;
  dependencies: FixtureLineupCreateDependencies;
}): Promise<{
  selected_team: Team | null;
  team_players: TeamPlayer[];
  selected_players: CreateFixtureLineupInput["selected_players"];
  validation_error: string;
}> {
  if (!command.team_id) {
    return {
      selected_team: null,
      team_players: [],
      selected_players: [],
      validation_error: "",
    };
  }
  const result = await load_fixture_lineup_create_team_data(
    command.team_id,
    command.selected_fixture,
    command.current_auth_profile,
    command.max_players,
    command.dependencies,
  );
  return {
    selected_team: result.selected_team,
    team_players: result.team_players,
    selected_players: result.selected_players,
    validation_error: result.validation_error,
  };
}
