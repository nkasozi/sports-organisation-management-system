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
  const position_filter = fixture.organization_id
    ? { organization_id: fixture.organization_id }
    : {};
  const [
    home_result,
    away_result,
    home_players_result,
    away_players_result,
    home_memberships_result,
    away_memberships_result,
    positions_result,
  ] = await Promise.all([
    dependencies.team_use_cases.get_by_id(fixture.home_team_id),
    dependencies.team_use_cases.get_by_id(fixture.away_team_id),
    dependencies.player_use_cases.list_players_by_team(fixture.home_team_id),
    dependencies.player_use_cases.list_players_by_team(fixture.away_team_id),
    dependencies.player_team_membership_use_cases.list_memberships_by_team(
      fixture.home_team_id,
      { page_number: 1, page_size: 10000 },
    ),
    dependencies.player_team_membership_use_cases.list_memberships_by_team(
      fixture.away_team_id,
      { page_number: 1, page_size: 10000 },
    ),
    dependencies.player_position_use_cases.list(position_filter, {
      page_number: 1,
      page_size: 1000,
    }),
  ]);

  const position_name_by_id = build_position_name_by_id_map(
    positions_result.success ? positions_result.data.items : [],
  );

  return {
    success: true,
    data: {
      fixture,
      home_team: home_result.success
        ? create_present_managed_game_team_state(home_result.data)
        : create_missing_managed_game_team_state(),
      away_team: away_result.success
        ? create_present_managed_game_team_state(away_result.data)
        : create_missing_managed_game_team_state(),
      home_players:
        home_players_result.success && home_memberships_result.success
          ? build_team_players(
              home_players_result.data.items,
              home_memberships_result.data.items,
              position_name_by_id,
            )
          : [],
      away_players:
        away_players_result.success && away_memberships_result.success
          ? build_team_players(
              away_players_result.data.items,
              away_memberships_result.data.items,
              position_name_by_id,
            )
          : [],
      game_clock_seconds:
        fixture.status === "in_progress"
          ? (fixture.current_minute || 0) * 60
          : 0,
    },
  };
}
