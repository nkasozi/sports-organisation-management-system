import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { Result } from "$lib/core/types/Result";

import {
  resolve_fixture_display_names as load_fixture_display_names,
  resolve_sport_names_for_competitions as load_competition_sport_names,
} from "./dashboardPageResolvers";
import type {
  DashboardData,
  DashboardDependencies,
  DashboardStats,
} from "./dashboardPageTypes";
import type { DashboardFilters } from "./dashboardStatsLogic";

export {
  format_fixture_date,
  get_competition_initials,
  get_status_class,
  split_organization_name,
} from "./dashboardPageDisplayLogic";
export type { DashboardDependencies } from "./dashboardPageTypes";

const RECENT_COMPETITIONS_LIMIT = 3;
const UPCOMING_FIXTURES_LIMIT = 3;

function build_dashboard_organization_filter(filters: DashboardFilters): {
  organization_id?: string;
} {
  if (filters.organization_scope_state.status === "unscoped") {
    return {};
  }

  return {
    organization_id: filters.organization_scope_state.organization_id,
  };
}

function build_dashboard_fixture_filter(filters: DashboardFilters): {
  status: string;
  organization_id?: string;
} {
  if (filters.organization_scope_state.status === "unscoped") {
    return { status: filters.fixture_status };
  }

  return {
    status: filters.fixture_status,
    organization_id: filters.organization_scope_state.organization_id,
  };
}

function get_dashboard_organization_count(
  filters: DashboardFilters,
  org_result: Result<{ items: unknown[]; total_count: number }>,
): number {
  if (filters.organization_count_state.status === "fixed") {
    return filters.organization_count_state.value;
  }

  return org_result.success ? (org_result.data?.total_count ?? 0) : 0;
}

function extract_stats(
  filters: DashboardFilters,
  org_result: Result<{ items: unknown[]; total_count: number }>,
  comp_result: Result<{ items: unknown[]; total_count: number }>,
  team_result: Result<{ items: unknown[]; total_count: number }>,
  player_result: Result<{ items: unknown[]; total_count: number }>,
): DashboardStats {
  return {
    organizations: get_dashboard_organization_count(filters, org_result),
    competitions: comp_result.success
      ? (comp_result.data?.total_count ?? 0)
      : 0,
    teams: team_result.success ? (team_result.data?.total_count ?? 0) : 0,
    players: player_result.success ? (player_result.data?.total_count ?? 0) : 0,
  };
}

export async function load_dashboard_data(
  dependencies: DashboardDependencies,
  filters: DashboardFilters,
): Promise<Result<DashboardData>> {
  const organization_filter = build_dashboard_organization_filter(filters);
  const fixture_filter = build_dashboard_fixture_filter(filters);
  const [org_result, comp_result, team_result, player_result, fixture_result] =
    await Promise.all([
      dependencies.organization_use_cases.list(
        {},
        {
          page_number: 1,
          page_size: 1,
        },
      ),
      dependencies.competition_use_cases.list(organization_filter, {
        page_number: 1,
        page_size: 5,
      }),
      dependencies.team_use_cases.list(organization_filter, {
        page_number: 1,
        page_size: 100,
      }),
      dependencies.player_use_cases.list(organization_filter, {
        page_number: 1,
        page_size: 1,
      }),
      dependencies.fixture_use_cases.list(fixture_filter, {
        page_number: 1,
        page_size: 5,
      }),
    ]);

  const stats = extract_stats(
    filters,
    org_result,
    comp_result,
    team_result,
    player_result,
  );

  const recent_competitions =
    comp_result.success && comp_result.data
      ? (comp_result.data.items as Competition[]).slice(
          0,
          RECENT_COMPETITIONS_LIMIT,
        )
      : [];

  const competition_sport_names = await load_competition_sport_names(
    recent_competitions,
    dependencies,
  );

  const teams_map: Map<string, Team> =
    team_result.success && team_result.data
      ? new Map(
          (team_result.data.items as Team[]).map((team: Team) => [
            team.id,
            team,
          ]),
        )
      : new Map();

  const sorted_fixtures =
    fixture_result.success && fixture_result.data
      ? (fixture_result.data.items as Fixture[])
          .sort(
            (first: Fixture, second: Fixture) =>
              new Date(first.scheduled_date).getTime() -
              new Date(second.scheduled_date).getTime(),
          )
          .slice(0, UPCOMING_FIXTURES_LIMIT)
      : [];

  const fixture_display_names = await load_fixture_display_names(
    sorted_fixtures,
    dependencies,
  );

  return {
    success: true,
    data: {
      stats,
      recent_competitions,
      upcoming_fixtures: sorted_fixtures,
      teams_map,
      competition_names: fixture_display_names.competition_names,
      sport_names: fixture_display_names.sport_names,
      competition_sport_names,
    },
  };
}
