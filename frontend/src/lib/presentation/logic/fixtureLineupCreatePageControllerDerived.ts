import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import { is_field_restricted_by_authorization } from "$lib/core/interfaces/ports";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";
import { resolve_fixture_lineup_create_organization_state } from "./fixtureLineupCreatePageContracts";
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
  user_team_id?: string;
  current_fixture_title: string;
  organization_select_options: Array<{ value: string; label: string }>;
  all_fixtures_for_org: Fixture[];
  fixtures_for_user_team: Fixture[];
  non_scheduled_fixtures_count: number;
  fixtures_for_organization: Fixture[];
  fixture_select_options: Array<{
    value: string;
    label: string;
    group: string;
  }>;
  team_select_options: Array<{ value: string; label: string }>;
  filtered_team_players: TeamPlayer[];
  wizard_steps: ReturnType<typeof build_fixture_lineup_create_wizard_steps>;
}

function is_fixture_lineup_create_field_restricted(
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
  field_name: string,
): boolean {
  return current_auth_profile_state.status === "present"
    ? is_field_restricted_by_authorization(
        current_auth_profile_state.profile,
        field_name,
      )
    : true;
}

function get_fixture_lineup_create_user_team_id(
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
): string | undefined {
  return current_auth_profile_state.status === "present"
    ? current_auth_profile_state.profile.team_id
    : void 0;
}

export function build_fixture_lineup_create_page_derived_state(
  params: FixtureLineupCreateDerivedStateParams,
): FixtureLineupCreateDerivedState {
  const organization_is_restricted = is_fixture_lineup_create_field_restricted(
    params.current_auth_profile_state,
    "organization_id",
  );
  const team_is_restricted = is_fixture_lineup_create_field_restricted(
    params.current_auth_profile_state,
    "team_id",
  );
  const user_team_id = get_fixture_lineup_create_user_team_id(
    params.current_auth_profile_state,
  );
  const current_fixture_title =
    params.selected_fixture_state.status === "present"
      ? get_fixture_display_name(
          params.selected_fixture_state.fixture,
          params.all_teams,
          params.all_competitions,
        )
      : "";
  const organization_select_options = params.organizations.map(
    (organization: Organization) => ({
      value: organization.id,
      label: organization.name,
    }),
  );
  const all_fixtures_for_org = params.form_data.organization_id
    ? params.fixtures.filter(
        (fixture: Fixture) =>
          fixture.organization_id === params.form_data.organization_id,
      )
    : params.fixtures;
  const fixtures_for_user_team =
    team_is_restricted && user_team_id
      ? all_fixtures_for_org.filter(
          (fixture: Fixture) =>
            fixture.home_team_id === user_team_id ||
            fixture.away_team_id === user_team_id,
        )
      : all_fixtures_for_org;
  const non_scheduled_fixtures_count = fixtures_for_user_team.filter(
    (fixture: Fixture) => fixture.status !== "scheduled",
  ).length;
  const fixtures_for_organization = fixtures_for_user_team.filter(
    (fixture: Fixture) =>
      fixture.status === "scheduled" &&
      !params.fixtures_with_complete_lineups.has(fixture.id),
  );
  const fixture_select_options = fixtures_for_organization.map(
    (fixture: Fixture) => ({
      value: fixture.id,
      label: get_fixture_display_name(
        fixture,
        params.all_teams,
        params.all_competitions,
      ),
      group:
        params.all_competitions.find(
          (competition: Competition) =>
            competition.id === fixture.competition_id,
        )?.name || "",
    }),
  );
  const team_select_options = params.available_teams.map((team: Team) => ({
    value: team.id,
    label: params.fixture_team_label_by_team_id.get(team.id) || team.name,
  }));
  return {
    organization_is_restricted,
    team_is_restricted,
    user_team_id,
    current_fixture_title,
    organization_select_options,
    all_fixtures_for_org,
    fixtures_for_user_team,
    non_scheduled_fixtures_count,
    fixtures_for_organization,
    fixture_select_options,
    team_select_options,
    filtered_team_players: build_filtered_team_players(
      params.team_players,
      params.player_search_text,
    ),
    wizard_steps: build_fixture_lineup_create_wizard_steps(
      params.selected_organization_state.status === "present",
      params.selected_fixture_state.status === "present",
      params.selected_team_state.status === "present",
      params.form_data.selected_players.length,
      params.min_players,
      params.max_players,
      params.confirm_lock_understood,
    ),
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
