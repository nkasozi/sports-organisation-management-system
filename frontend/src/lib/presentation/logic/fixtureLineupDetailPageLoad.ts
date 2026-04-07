import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";
import {
  build_position_name_by_id,
  build_team_players,
  type TeamPlayer,
} from "$lib/core/services/teamPlayers";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type PaginatedAsyncResult,
} from "$lib/core/types/Result";

const FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS = {
  FIRST_PAGE_NUMBER: 1,
  PLAYERS_PAGE_SIZE: 500,
  MEMBERSHIPS_PAGE_SIZE: 5000,
  POSITIONS_PAGE_SIZE: 500,
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

export interface FixtureLineupDetailPageData {
  lineup: FixtureLineup;
  fixture: Fixture | null;
  team: Team | null;
  home_team: Team | null;
  away_team: Team | null;
  team_players: TeamPlayer[];
}

function build_position_filter(
  organization_id: string | undefined,
): { organization_id: string } | undefined {
  if (!organization_id) {
    return undefined;
  }

  return { organization_id };
}

async function load_fixture_teams(
  fixture: Fixture | null,
  dependencies: FixtureLineupDetailPageDependencies,
): Promise<{ home_team: Team | null; away_team: Team | null }> {
  if (!fixture) {
    return { home_team: null, away_team: null };
  }

  const [home_team_result, away_team_result] = await Promise.all([
    dependencies.get_team_by_id(fixture.home_team_id),
    dependencies.get_team_by_id(fixture.away_team_id),
  ]);

  return {
    home_team: home_team_result.success ? home_team_result.data : null,
    away_team: away_team_result.success ? away_team_result.data : null,
  };
}

export async function load_fixture_lineup_detail_page_data(input: {
  lineup_id: string;
  organization_id: string | undefined;
  dependencies: FixtureLineupDetailPageDependencies;
}): AsyncResult<FixtureLineupDetailPageData> {
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
  const [
    fixture_result,
    team_result,
    players_result,
    memberships_result,
    positions_result,
  ] = await Promise.all([
    input.dependencies.get_fixture_by_id(lineup.fixture_id),
    input.dependencies.get_team_by_id(lineup.team_id),
    input.dependencies.list_players_by_team(lineup.team_id, {
      page_number: FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS.FIRST_PAGE_NUMBER,
      page_size: FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS.PLAYERS_PAGE_SIZE,
    }),
    input.dependencies.list_memberships_by_team(lineup.team_id, {
      page_number: FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS.FIRST_PAGE_NUMBER,
      page_size: FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS.MEMBERSHIPS_PAGE_SIZE,
    }),
    input.dependencies.list_positions(
      build_position_filter(input.organization_id),
      {
        page_number: FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS.FIRST_PAGE_NUMBER,
        page_size: FIXTURE_LINEUP_DETAIL_PAGE_LOAD_SETTINGS.POSITIONS_PAGE_SIZE,
      },
    ),
  ]);

  const fixture = fixture_result.success ? fixture_result.data : null;
  const team = team_result.success ? team_result.data : null;
  const players = players_result.success ? players_result.data.items : [];
  const memberships = memberships_result.success
    ? memberships_result.data.items
    : [];
  const positions = positions_result.success ? positions_result.data.items : [];
  const position_name_by_id = build_position_name_by_id(positions);
  const team_players = build_team_players(
    players,
    memberships,
    position_name_by_id,
  );
  const { home_team, away_team } = await load_fixture_teams(
    fixture,
    input.dependencies,
  );

  return create_success_result({
    lineup,
    fixture,
    team,
    home_team,
    away_team,
    team_players,
  });
}
