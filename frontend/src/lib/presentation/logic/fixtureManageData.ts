import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
import type { PlayerPositionUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerPositionUseCasesPort";
import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamMembershipUseCasesPort";
import type { PlayerUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerUseCasesPort";
import type { TeamUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/TeamUseCasesPort";
import {
  build_position_name_by_id_map,
  build_team_players,
} from "$lib/presentation/logic/fixtureManageState";
import {
  create_missing_managed_game_team_state,
  create_present_managed_game_team_state,
  type ManagedGameLoadResult,
  type ManagedGameTeamState,
} from "$lib/presentation/logic/managedGamePageTypes";

interface FixtureManageDataDependencies {
  fixture_use_cases: Pick<FixtureUseCasesPort, "get_by_id">;
  team_use_cases: Pick<TeamUseCasesPort, "get_by_id">;
  player_use_cases: Pick<PlayerUseCasesPort, "list_players_by_team">;
  player_team_membership_use_cases: Pick<
    PlayerTeamMembershipUseCasesPort,
    "list_memberships_by_team"
  >;
  player_position_use_cases: Pick<PlayerPositionUseCasesPort, "list">;
}

interface ManagedTeamSideRecords {
  team_result: Awaited<
    ReturnType<FixtureManageDataDependencies["team_use_cases"]["get_by_id"]>
  >;
  players_result: Awaited<
    ReturnType<
      FixtureManageDataDependencies["player_use_cases"]["list_players_by_team"]
    >
  >;
  memberships_result: Awaited<
    ReturnType<
      FixtureManageDataDependencies["player_team_membership_use_cases"]["list_memberships_by_team"]
    >
  >;
}

async function load_managed_team_side(
  team_id: string,
  dependencies: FixtureManageDataDependencies,
): Promise<ManagedTeamSideRecords> {
  const [team_result, players_result, memberships_result] = await Promise.all([
    dependencies.team_use_cases.get_by_id(team_id),
    dependencies.player_use_cases.list_players_by_team(team_id),
    dependencies.player_team_membership_use_cases.list_memberships_by_team(
      team_id,
      { page_number: 1, page_size: 10000 },
    ),
  ]);
  return { team_result, players_result, memberships_result };
}

async function load_position_name_by_id(
  organization_id: string,
  dependencies: FixtureManageDataDependencies,
): Promise<Map<string, string>> {
  const positions_result = await dependencies.player_position_use_cases.list(
    organization_id ? { organization_id } : {},
    { page_number: 1, page_size: 1000 },
  );
  return build_position_name_by_id_map(
    positions_result.success ? positions_result.data.items : [],
  );
}

function build_managed_team_state(
  side_records: ManagedTeamSideRecords,
): ManagedGameTeamState {
  return side_records.team_result.success
    ? create_present_managed_game_team_state(side_records.team_result.data)
    : create_missing_managed_game_team_state();
}

function build_managed_team_players(
  side_records: ManagedTeamSideRecords,
  position_name_by_id: Map<string, string>,
): ReturnType<typeof build_team_players> {
  const { players_result, memberships_result } = side_records;
  return players_result.success && memberships_result.success
    ? build_team_players(
        players_result.data.items,
        memberships_result.data.items,
        position_name_by_id,
      )
    : [];
}

export async function load_fixture_manage_bundle(
  fixture_id: string,
  dependencies: FixtureManageDataDependencies,
): Promise<ManagedGameLoadResult> {
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success) {
    return { success: false, error_message: fixture_result.error };
  }
  if (!fixture_result.data) {
    return { success: false, error_message: "Game not found" };
  }

  const fixture = fixture_result.data;
  const [home_side, away_side, position_name_by_id] = await Promise.all([
    load_managed_team_side(fixture.home_team_id, dependencies),
    load_managed_team_side(fixture.away_team_id, dependencies),
    load_position_name_by_id(fixture.organization_id, dependencies),
  ]);

  return {
    success: true,
    data: {
      fixture,
      home_team: build_managed_team_state(home_side),
      away_team: build_managed_team_state(away_side),
      home_players: build_managed_team_players(home_side, position_name_by_id),
      away_players: build_managed_team_players(away_side, position_name_by_id),
      game_clock_seconds:
        fixture.status === FIXTURE_STATUS.IN_PROGRESS
          ? (fixture.current_minute || 0) * 60
          : 0,
    },
  };
}
