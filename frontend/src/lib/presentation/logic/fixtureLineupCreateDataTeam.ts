import type { Fixture } from "$lib/core/entities/Fixture";
import { ANY_VALUE } from "$lib/core/interfaces/ports";
import {
  build_error_message,
  derive_initial_selected_players,
} from "$lib/core/services/fixtureLineupWizard";
import {
  build_position_name_by_id,
  build_team_players,
} from "$lib/core/services/teamPlayers";

import type {
  FixtureLineupCreateDependencies,
  FixtureLineupCreateTeamData,
} from "./fixtureLineupCreateDataTypes";
import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateFixtureState,
} from "./fixtureLineupCreatePageContracts";
import {
  create_missing_fixture_lineup_create_team_state,
  create_present_fixture_lineup_create_team_state,
} from "./fixtureLineupCreatePageContracts";

export async function load_fixture_lineup_create_team_data(
  team_id: string,
  selected_fixture_state: FixtureLineupCreateFixtureState,
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
  max_players: number,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureLineupCreateTeamData> {
  if (selected_fixture_state.status === "missing")
    return {
      selected_team_state: create_missing_fixture_lineup_create_team_state(),
      team_players: [],
      selected_players: [],
      validation_error: build_error_message(
        "No fixture selected.",
        "A fixture is required before you can choose a team.",
        "Select a fixture in Step 1, then continue.",
      ),
    };
  const selected_fixture: Fixture = selected_fixture_state.fixture;
  const fixture_team_ids = new Set<string>([
    selected_fixture.home_team_id,
    selected_fixture.away_team_id,
  ]);
  if (!fixture_team_ids.has(team_id))
    return {
      selected_team_state: create_missing_fixture_lineup_create_team_state(),
      team_players: [],
      selected_players: [],
      validation_error: build_error_message(
        "Invalid team selection.",
        "Only teams participating in the selected fixture can submit a lineup.",
        "Choose either the home or away team listed for the fixture.",
      ),
    };
  const [team_result, players_result, memberships_result, positions_result] =
    await Promise.all([
      dependencies.team_use_cases.get_by_id(team_id),
      dependencies.player_use_cases.list_players_by_team(team_id, {
        page_number: 1,
        page_size: 500,
      }),
      dependencies.membership_use_cases.list_memberships_by_team(team_id, {
        page_number: 1,
        page_size: 5000,
      }),
      dependencies.player_position_use_cases.list(
        current_auth_profile_state.status === "present" &&
          current_auth_profile_state.profile.organization_id &&
          current_auth_profile_state.profile.organization_id !== ANY_VALUE
          ? {
              organization_id:
                current_auth_profile_state.profile.organization_id,
            }
          : {},
        { page_number: 1, page_size: 500 },
      ),
    ]);
  const selected_team_state =
    team_result.success && team_result.data
      ? create_present_fixture_lineup_create_team_state(team_result.data)
      : create_missing_fixture_lineup_create_team_state();
  const position_name_by_id = build_position_name_by_id(
    positions_result.success ? positions_result.data.items : [],
  );
  const team_players = build_team_players(
    players_result.success && players_result.data
      ? players_result.data.items
      : [],
    memberships_result.success && memberships_result.data
      ? memberships_result.data.items
      : [],
    position_name_by_id,
  );
  if (team_players.length === 0)
    return {
      selected_team_state,
      team_players: [],
      selected_players: [],
      validation_error: build_error_message(
        "No players found for this team.",
        "A team must have players assigned via Player-Team Memberships.",
        "Create Player-Team Memberships for this team, then retry.",
      ),
    };
  return {
    selected_team_state,
    team_players,
    selected_players: derive_initial_selected_players(
      team_players,
      max_players,
    ),
    validation_error: "",
  };
}
