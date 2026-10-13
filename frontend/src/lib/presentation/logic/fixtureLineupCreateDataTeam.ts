import type { Fixture } from "$lib/core/entities/Fixture";
import { ANY_VALUE } from "$lib/core/interfaces/ports";
import {
  build_error_message,
  derive_initial_selected_players,
} from "$lib/core/services/fixtureLineupWizard";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import {
  build_position_name_by_id,
  build_team_players,
} from "$lib/core/services/teamPlayers";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type {
  FixtureLineupCreateDependencies,
  FixtureLineupCreateTeamData,
} from "./fixtureLineupCreateDataTypes";
import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";
import {
  create_missing_fixture_lineup_create_team_state,
  create_present_fixture_lineup_create_team_state,
} from "./fixtureLineupCreatePageContracts";

type TeamDependencies = FixtureLineupCreateDependencies;

interface TeamRecords {
  team: Awaited<ReturnType<TeamDependencies["team_use_cases"]["get_by_id"]>>;
  players: Awaited<
    ReturnType<TeamDependencies["player_use_cases"]["list_players_by_team"]>
  >;
  memberships: Awaited<
    ReturnType<
      TeamDependencies["membership_use_cases"]["list_memberships_by_team"]
    >
  >;
  positions: Awaited<
    ReturnType<TeamDependencies["player_position_use_cases"]["list"]>
  >;
}

function create_team_data_failure(
  selected_team_state: FixtureLineupCreateTeamState,
  error: string,
  why: string,
  how_to_fix: string,
): FixtureLineupCreateTeamData {
  return {
    selected_team_state,
    team_players: [],
    selected_players: [],
    validation_error: build_error_message(error, why, how_to_fix),
  };
}

function build_player_position_filter(
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
): Record<string, string> {
  return current_auth_profile_state.status === PRESENCE_STATUS.PRESENT &&
    current_auth_profile_state.profile.organization_id &&
    current_auth_profile_state.profile.organization_id !== ANY_VALUE
    ? { organization_id: current_auth_profile_state.profile.organization_id }
    : {};
}

async function load_team_records(
  team_id: string,
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
  dependencies: FixtureLineupCreateDependencies,
): Promise<TeamRecords> {
  const [team, players, memberships, positions] = await Promise.all([
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
      build_player_position_filter(current_auth_profile_state),
      { page_number: 1, page_size: 500 },
    ),
  ]);
  return { team, players, memberships, positions };
}

function build_team_players_from_records(records: TeamRecords): TeamPlayer[] {
  const position_name_by_id = build_position_name_by_id(
    records.positions.success ? records.positions.data.items : [],
  );
  return build_team_players(
    records.players.success && records.players.data
      ? records.players.data.items
      : [],
    records.memberships.success && records.memberships.data
      ? records.memberships.data.items
      : [],
    position_name_by_id,
  );
}

function build_team_data_from_records(
  records: TeamRecords,
  max_players: number,
): FixtureLineupCreateTeamData {
  const selected_team_state =
    records.team.success && records.team.data
      ? create_present_fixture_lineup_create_team_state(records.team.data)
      : create_missing_fixture_lineup_create_team_state();
  const team_players = build_team_players_from_records(records);
  if (team_players.length === 0)
    return create_team_data_failure(
      selected_team_state,
      "No players found for this team.",
      "A team must have players assigned via Player-Team Memberships.",
      "Create Player-Team Memberships for this team, then retry.",
    );
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

export async function load_fixture_lineup_create_team_data(
  team_id: string,
  selected_fixture_state: FixtureLineupCreateFixtureState,
  current_auth_profile_state: FixtureLineupCreateAuthProfileState,
  max_players: number,
  dependencies: FixtureLineupCreateDependencies,
): Promise<FixtureLineupCreateTeamData> {
  if (selected_fixture_state.status === PRESENCE_STATUS.MISSING)
    return create_team_data_failure(
      create_missing_fixture_lineup_create_team_state(),
      "No fixture selected.",
      "A fixture is required before you can choose a team.",
      "Select a fixture in Step 1, then continue.",
    );
  const selected_fixture: Fixture = selected_fixture_state.fixture;
  const fixture_team_ids = new Set<string>([
    selected_fixture.home_team_id,
    selected_fixture.away_team_id,
  ]);
  if (!fixture_team_ids.has(team_id))
    return create_team_data_failure(
      create_missing_fixture_lineup_create_team_state(),
      "Invalid team selection.",
      "Only teams participating in the selected fixture can submit a lineup.",
      "Choose either the home or away team listed for the fixture.",
    );
  const records = await load_team_records(
    team_id,
    current_auth_profile_state,
    dependencies,
  );
  return build_team_data_from_records(records, max_players);
}
