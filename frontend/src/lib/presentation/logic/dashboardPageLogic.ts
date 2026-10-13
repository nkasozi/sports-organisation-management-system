import type { Result } from "$lib/core/types/Result";

import { DashboardOrganizationScopeStatus } from "./dashboardPageConstants";
import {
  build_dashboard_teams_map,
  type DashboardCountResult,
  extract_recent_competitions,
  extract_stats,
  extract_upcoming_fixtures,
} from "./dashboardPageExtractors";
import {
  resolve_fixture_display_names as load_fixture_display_names,
  resolve_sport_names_for_competitions as load_competition_sport_names,
} from "./dashboardPageResolvers";
import type {
  DashboardData,
  DashboardDependencies,
} from "./dashboardPageTypes";
import type { DashboardFilters } from "./dashboardStatsLogic";

export {
  format_fixture_date,
  get_competition_initials,
  get_status_class,
  split_organization_name,
} from "./dashboardPageDisplayLogic";
export type { DashboardDependencies } from "./dashboardPageTypes";

function build_dashboard_organization_filter(filters: DashboardFilters): {
  organization_id?: string;
} {
  if (
    filters.organization_scope_state.status ===
    DashboardOrganizationScopeStatus.UNSCOPED
  ) {
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
  if (
    filters.organization_scope_state.status ===
    DashboardOrganizationScopeStatus.UNSCOPED
  ) {
    return { status: filters.fixture_status };
  }

  return {
    status: filters.fixture_status,
    organization_id: filters.organization_scope_state.organization_id,
  };
}

async function fetch_dashboard_sources(
  dependencies: DashboardDependencies,
  filters: DashboardFilters,
): Promise<
  [
    DashboardCountResult,
    DashboardCountResult,
    DashboardCountResult,
    DashboardCountResult,
    DashboardCountResult,
  ]
> {
  const organization_filter = build_dashboard_organization_filter(filters);
  const fixture_filter = build_dashboard_fixture_filter(filters);
  return Promise.all([
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
}

export async function load_dashboard_data(
  dependencies: DashboardDependencies,
  filters: DashboardFilters,
): Promise<Result<DashboardData>> {
  const [org_result, comp_result, team_result, player_result, fixture_result] =
    await fetch_dashboard_sources(dependencies, filters);
  const stats = extract_stats(
    filters,
    org_result,
    comp_result,
    team_result,
    player_result,
  );
  const recent_competitions = extract_recent_competitions(comp_result);
  const competition_sport_names = await load_competition_sport_names(
    recent_competitions,
    dependencies,
  );
  const teams_map = build_dashboard_teams_map(team_result);
  const sorted_fixtures = extract_upcoming_fixtures(fixture_result);
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
