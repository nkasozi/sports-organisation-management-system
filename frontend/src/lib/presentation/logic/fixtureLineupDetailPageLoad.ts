import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type PaginatedAsyncResult,
  type Result,
} from "$lib/core/types/Result";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type {
  FixtureLineupDetailFixtureState,
  FixtureLineupDetailOrganizationScopeState,
  FixtureLineupDetailPageViewData,
  FixtureLineupDetailTeamState,
} from "./fixtureLineupDetailPageContracts";
import { load_fixture_lineup_detail_team_players } from "./fixtureLineupDetailPageRoster";

const FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS = {
  LINEUP_NOT_FOUND: "Lineup not found",
} as const;

export interface FixtureLineupDetailPageDependencies {
  get_fixture_lineup_by_id(id: string): AsyncResult<FixtureLineup>;
  get_fixture_by_id(id: string): AsyncResult<Fixture>;
  get_team_by_id(id: string): AsyncResult<Team>;
  list_players_by_team(
    team_id: string,
    options: { page_number: number; page_size: number },
  ): PaginatedAsyncResult<Player>;
  list_memberships_by_team(
    team_id: string,
    options: { page_number: number; page_size: number },
  ): PaginatedAsyncResult<PlayerTeamMembership>;
  list_positions(
    filter:
      | {
          organization_id: string;
        }
      | undefined,
    options: { page_number: number; page_size: number },
  ): PaginatedAsyncResult<PlayerPosition>;
}

function build_missing_team_state(): FixtureLineupDetailTeamState {
  return { status: "missing" };
}

function build_fixture_lineup_detail_fixture_state(
  fixture_result: Result<Fixture>,
): FixtureLineupDetailFixtureState {
  if (!fixture_result.success) {
    return { status: "missing" };
  }

  return { status: "present", fixture: fixture_result.data };
}

function build_fixture_lineup_detail_team_state(
  team_result: Result<Team>,
): FixtureLineupDetailTeamState {
  if (!team_result.success) {
    return build_missing_team_state();
  }

  return { status: "present", team: team_result.data };
}

async function load_fixture_teams(
  fixture_state: FixtureLineupDetailFixtureState,
  dependencies: FixtureLineupDetailPageDependencies,
): Promise<{
  home_team_state: FixtureLineupDetailTeamState;
  away_team_state: FixtureLineupDetailTeamState;
}> {
  if (fixture_state.status === PRESENCE_STATUS.MISSING) {
    return {
      home_team_state: build_missing_team_state(),
      away_team_state: build_missing_team_state(),
    };
  }

  const [home_team_result, away_team_result] = await Promise.all([
    dependencies.get_team_by_id(fixture_state.fixture.home_team_id),
    dependencies.get_team_by_id(fixture_state.fixture.away_team_id),
  ]);

  return {
    home_team_state: build_fixture_lineup_detail_team_state(home_team_result),
    away_team_state: build_fixture_lineup_detail_team_state(away_team_result),
  };
}

export async function load_fixture_lineup_detail_page_data(input: {
  lineup_id: string;
  organization_scope_state: FixtureLineupDetailOrganizationScopeState;
  dependencies: FixtureLineupDetailPageDependencies;
}): AsyncResult<FixtureLineupDetailPageViewData> {
  const lineup_result = await input.dependencies.get_fixture_lineup_by_id(
    input.lineup_id,
  );
  if (!lineup_result.success) {
    return create_failure_result(
      lineup_result.error ||
        FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS.LINEUP_NOT_FOUND,
    );
  }

  const lineup = lineup_result.data;
  const [fixture_result, team_result, team_players] = await Promise.all([
    input.dependencies.get_fixture_by_id(lineup.fixture_id),
    input.dependencies.get_team_by_id(lineup.team_id),
    load_fixture_lineup_detail_team_players(
      lineup,
      input.organization_scope_state,
      input.dependencies,
    ),
  ]);
  const fixture_state =
    build_fixture_lineup_detail_fixture_state(fixture_result);
  const team_state = build_fixture_lineup_detail_team_state(team_result);
  const { home_team_state, away_team_state } = await load_fixture_teams(
    fixture_state,
    input.dependencies,
  );

  return create_success_result({
    lineup,
    fixture_state,
    team_state,
    team_players,
    home_team_state,
    away_team_state,
  });
}
