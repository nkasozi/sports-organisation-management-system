import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { Result } from "$lib/core/types/Result";

import {
  DASHBOARD_EVENT,
  DashboardOrganizationCountStatus,
  DashboardSource,
} from "./dashboardPageConstants";
import type { DashboardStats } from "./dashboardPageTypes";
import type { DashboardFilters } from "./dashboardStatsLogic";

const RECENT_COMPETITIONS_LIMIT = 3;
const UPCOMING_FIXTURES_LIMIT = 3;

export type DashboardCountResult = Result<{
  items: unknown[];
  total_count: number;
}>;

function get_dashboard_source_count(
  source: DashboardSource,
  result: DashboardCountResult,
): number {
  if (result.success) return result.data.total_count;
  console.warn("[Dashboard] Source failed to load; showing zero", {
    event: DASHBOARD_EVENT.SOURCE_LOAD_FAILED,
    source,
    error: result.error,
  });
  return 0;
}

function get_dashboard_organization_count(
  filters: DashboardFilters,
  org_result: DashboardCountResult,
): number {
  if (
    filters.organization_count_state.status ===
    DashboardOrganizationCountStatus.FIXED
  ) {
    return filters.organization_count_state.value;
  }

  return get_dashboard_source_count(DashboardSource.ORGANIZATIONS, org_result);
}

export function extract_stats(
  filters: DashboardFilters,
  org_result: DashboardCountResult,
  comp_result: DashboardCountResult,
  team_result: DashboardCountResult,
  player_result: DashboardCountResult,
): DashboardStats {
  return {
    organizations: get_dashboard_organization_count(filters, org_result),
    competitions: get_dashboard_source_count(
      DashboardSource.COMPETITIONS,
      comp_result,
    ),
    teams: get_dashboard_source_count(DashboardSource.TEAMS, team_result),
    players: get_dashboard_source_count(DashboardSource.PLAYERS, player_result),
  };
}

export function extract_recent_competitions(
  comp_result: DashboardCountResult,
): Competition[] {
  return comp_result.success && comp_result.data
    ? (comp_result.data.items as Competition[]).slice(
        0,
        RECENT_COMPETITIONS_LIMIT,
      )
    : [];
}

export function build_dashboard_teams_map(
  team_result: DashboardCountResult,
): Map<string, Team> {
  return team_result.success && team_result.data
    ? new Map(
        (team_result.data.items as Team[]).map((team: Team) => [team.id, team]),
      )
    : new Map();
}

export function extract_upcoming_fixtures(
  fixture_result: DashboardCountResult,
): Fixture[] {
  return fixture_result.success && fixture_result.data
    ? (fixture_result.data.items as Fixture[])
        .sort(
          (first: Fixture, second: Fixture) =>
            new Date(first.scheduled_date).getTime() -
            new Date(second.scheduled_date).getTime(),
        )
        .slice(0, UPCOMING_FIXTURES_LIMIT)
    : [];
}
