import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import {
  build_position_name_by_id,
  build_team_players,
  type TeamPlayer,
} from "$lib/core/services/teamPlayers";

import {
  FIXTURE_LINEUP_DETAIL_ORGANIZATION_SCOPE_STATUS,
  type FixtureLineupDetailOrganizationScopeState,
} from "./fixtureLineupDetailPageContracts";
import type { FixtureLineupDetailPageDependencies } from "./fixtureLineupDetailPageLoad";

const FIXTURE_LINEUP_DETAIL_ROSTER_SETTINGS = {
  FIRST_PAGE_NUMBER: 1,
  PLAYERS_PAGE_SIZE: 500,
  MEMBERSHIPS_PAGE_SIZE: 5000,
  POSITIONS_PAGE_SIZE: 500,
} as const;

type FixtureLineupDetailRosterDependencies = Pick<
  FixtureLineupDetailPageDependencies,
  "list_players_by_team" | "list_memberships_by_team" | "list_positions"
>;

function build_position_filter(
  organization_scope_state: FixtureLineupDetailOrganizationScopeState,
): { organization_id: string } | undefined {
  if (
    organization_scope_state.status ===
    FIXTURE_LINEUP_DETAIL_ORGANIZATION_SCOPE_STATUS.UNSCOPED
  ) {
    return;
  }

  return { organization_id: organization_scope_state.organization_id };
}

export async function load_fixture_lineup_detail_team_players(
  lineup: FixtureLineup,
  organization_scope_state: FixtureLineupDetailOrganizationScopeState,
  dependencies: FixtureLineupDetailRosterDependencies,
): Promise<TeamPlayer[]> {
  const settings = FIXTURE_LINEUP_DETAIL_ROSTER_SETTINGS;
  const [players_result, memberships_result, positions_result] =
    await Promise.all([
      dependencies.list_players_by_team(lineup.team_id, {
        page_number: settings.FIRST_PAGE_NUMBER,
        page_size: settings.PLAYERS_PAGE_SIZE,
      }),
      dependencies.list_memberships_by_team(lineup.team_id, {
        page_number: settings.FIRST_PAGE_NUMBER,
        page_size: settings.MEMBERSHIPS_PAGE_SIZE,
      }),
      dependencies.list_positions(
        build_position_filter(organization_scope_state),
        {
          page_number: settings.FIRST_PAGE_NUMBER,
          page_size: settings.POSITIONS_PAGE_SIZE,
        },
      ),
    ]);
  const players = players_result.success ? players_result.data.items : [];
  const memberships = memberships_result.success
    ? memberships_result.data.items
    : [];
  const positions = positions_result.success ? positions_result.data.items : [];
  return build_team_players(
    players,
    memberships,
    build_position_name_by_id(positions),
  );
}
