import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import { is_field_restricted_by_authorization } from "$lib/core/interfaces/ports";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";
import { resolve_fixture_lineup_create_organization_state } from "./fixtureLineupCreatePageContracts";
import {
  build_fixture_lineup_create_fixture_selection_state,
  type FixtureLineupCreateFixtureSelectOption,
} from "./fixtureLineupCreatePageControllerDerivedFixtures";
import {
  build_filtered_team_players,
  build_fixture_lineup_create_wizard_steps,
  get_fixture_display_name,
} from "./fixtureLineupCreateState";

interface FixtureLineupCreateDerivedStateParams {
  current_auth_profile_state: FixtureLineupCreateAuthProfileState;
  form_data: CreateFixtureLineupInput;
  selected_organization_state: FixtureLineupCreateOrganizationState;
  selected_fixture_state: FixtureLineupCreateFixtureState;
  selected_team_state: FixtureLineupCreateTeamState;
  team_players: TeamPlayer[];
  player_search_text: string;
  organizations: Organization[];
  fixtures: Fixture[];
  all_teams: Team[];
  all_competitions: Competition[];
  available_teams: Team[];
  fixtures_with_complete_lineups: Set<string>;
  fixture_team_label_by_team_id: Map<string, string>;
  min_players: number;
  max_players: number;
  confirm_lock_understood: boolean;
}

interface FixtureLineupCreateDerivedState {
  organization_is_restricted: boolean;
  team_is_restricted: boolean;
  user_team: Option<string>;
  current_fixture_title: string;
  organization_select_options: Array<{ value: string; label: string }>;
  all_fixtures_for_org: Fixture[];
  fixtures_for_user_team: Fixture[];
  non_scheduled_fixtures_count: number;
  fixtures_for_organization: Fixture[];
  fixture_select_options: FixtureLineupCreateFixtureSelectOption[];
  team_select_options: Array<{ value: string; label: string }>;
  filtered_team_players: TeamPlayer[];
  wizard_steps: ReturnType<typeof build_fixture_lineup_create_wizard_steps>;
}

function is_fixture_lineup_create_field_restricted(
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
  field_name: string,
): boolean {
  return current_auth_profile_state.status === PRESENCE_STATUS.PRESENT
    ? is_field_restricted_by_authorization(
        current_auth_profile_state.profile,
        field_name,
      )
    : true;
}

function get_fixture_lineup_create_user_team(
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
): Option<string> {
  if (current_auth_profile_state.status !== PRESENCE_STATUS.PRESENT)
    return create_none_option();
  const team_id = current_auth_profile_state.profile.team_id;
  return team_id ? create_some_option(team_id) : create_none_option();
}

function build_organization_select_options(
  organizations: Organization[],
): Array<{ value: string; label: string }> {
  return organizations.map((organization: Organization) => ({
    value: organization.id,
    label: organization.name,
  }));
}

function build_team_select_options(
  params: FixtureLineupCreateDerivedStateParams,
): Array<{ value: string; label: string }> {
  return params.available_teams.map((team: Team) => ({
    value: team.id,
    label: params.fixture_team_label_by_team_id.get(team.id) || team.name,
  }));
}

function build_current_fixture_title(
  params: FixtureLineupCreateDerivedStateParams,
): string {
  return params.selected_fixture_state.status === PRESENCE_STATUS.PRESENT
    ? get_fixture_display_name(
        params.selected_fixture_state.fixture,
        params.all_teams,
        params.all_competitions,
      )
    : "";
}

function build_derived_wizard_steps(
  params: FixtureLineupCreateDerivedStateParams,
): ReturnType<typeof build_fixture_lineup_create_wizard_steps> {
  return build_fixture_lineup_create_wizard_steps(
    params.selected_organization_state.status === PRESENCE_STATUS.PRESENT,
    params.selected_fixture_state.status === PRESENCE_STATUS.PRESENT,
    params.selected_team_state.status === PRESENCE_STATUS.PRESENT,
    params.form_data.selected_players.length,
    params.min_players,
    params.max_players,
    params.confirm_lock_understood,
  );
}

export function build_fixture_lineup_create_page_derived_state(
  params: FixtureLineupCreateDerivedStateParams,
): FixtureLineupCreateDerivedState {
  const team_is_restricted = is_fixture_lineup_create_field_restricted(
    params.current_auth_profile_state,
    "team_id",
  );
  const user_team = get_fixture_lineup_create_user_team(
    params.current_auth_profile_state,
  );
  return {
    organization_is_restricted: is_fixture_lineup_create_field_restricted(
      params.current_auth_profile_state,
      "organization_id",
    ),
    team_is_restricted,
    user_team,
    current_fixture_title: build_current_fixture_title(params),
    organization_select_options: build_organization_select_options(
      params.organizations,
    ),
    ...build_fixture_lineup_create_fixture_selection_state({
      organization_id: params.form_data.organization_id,
      fixtures: params.fixtures,
      all_teams: params.all_teams,
      all_competitions: params.all_competitions,
      fixtures_with_complete_lineups: params.fixtures_with_complete_lineups,
      team_is_restricted,
      user_team,
    }),
    team_select_options: build_team_select_options(params),
    filtered_team_players: build_filtered_team_players(
      params.team_players,
      params.player_search_text,
    ),
    wizard_steps: build_derived_wizard_steps(params),
  };
}

export function sync_fixture_lineup_create_selected_organization(
  organization_id: string,
  organizations: Organization[],
): FixtureLineupCreateOrganizationState {
  return resolve_fixture_lineup_create_organization_state(
    organization_id,
    organizations,
  );
}
