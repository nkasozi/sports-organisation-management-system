import { type Mock, vi } from "vitest";

import type { DashboardDependencies } from "./dashboardPageLogic";
import type { DashboardFilters } from "./dashboardStatsLogic";

function create_empty_list_mock(): Mock {
  return vi.fn().mockResolvedValue({
    success: true,
    data: { items: [], total_count: 0 },
  });
}

function create_not_found_mock(): Mock {
  return vi.fn().mockResolvedValue({
    success: false,
    error: "not found",
  });
}

export function create_mock_dependencies(
  overrides: Partial<DashboardDependencies> = {},
): DashboardDependencies {
  return {
    organization_use_cases: {
      list: create_empty_list_mock(),
      get_by_id: create_not_found_mock(),
    },
    competition_use_cases: {
      list: create_empty_list_mock(),
      get_by_id: create_not_found_mock(),
    },
    team_use_cases: { list: create_empty_list_mock() },
    player_use_cases: { list: create_empty_list_mock() },
    fixture_use_cases: { list: create_empty_list_mock() },
    sport_use_cases: { get_by_id: create_not_found_mock() },
    ...overrides,
  } as DashboardDependencies;
}

export function create_default_filters(): DashboardFilters {
  return {
    organization_scope_state: { status: "unscoped" },
    fixture_status: "scheduled",
    organization_count_state: { status: "calculated" },
  } as DashboardFilters;
}
