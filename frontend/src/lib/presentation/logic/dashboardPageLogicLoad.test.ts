import { describe, expect, it, vi } from "vitest";

import { load_dashboard_data } from "./dashboardPageLogic";
import {
  create_default_filters,
  create_mock_dependencies,
} from "./dashboardPageLogic.test_support";
import type { DashboardFilters } from "./dashboardStatsLogic";

describe("load_dashboard_data", () => {
  it("returns zero stats when all use cases return empty lists", async () => {
    const dependencies = create_mock_dependencies();
    const filters = create_default_filters();

    const result = await load_dashboard_data(dependencies, filters);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.stats).toEqual({
      organizations: 0,
      competitions: 0,
      teams: 0,
      players: 0,
    });
    expect(dependencies.competition_use_cases.list).toHaveBeenCalledWith(
      {},
      expect.any(Object),
    );
    expect(dependencies.team_use_cases.list).toHaveBeenCalledWith(
      {},
      expect.any(Object),
    );
    expect(dependencies.player_use_cases.list).toHaveBeenCalledWith(
      {},
      expect.any(Object),
    );
  });

  it("returns correct counts from use case responses", async () => {
    const dependencies = create_mock_dependencies({
      organization_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: [], total_count: 3 },
        }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
      competition_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: {
            items: [
              {
                id: "comp_1",
                name: "League",
                organization_id: "org_1",
                status: "active",
                team_ids: [],
              },
            ],
            total_count: 5,
          },
        }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
      team_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: {
            items: [
              {
                id: "team_1",
                name: "Eagles",
                short_name: "EGL",
                organization_id: "org_1",
              },
            ],
            total_count: 10,
          },
        }),
      },
      player_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: [], total_count: 42 },
        }),
      },
    });
    const filters = create_default_filters();

    const result = await load_dashboard_data(dependencies, filters);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.stats).toEqual({
      organizations: 3,
      competitions: 5,
      teams: 10,
      players: 42,
    });
  });

  it("applies organization_count_override when set", async () => {
    const dependencies = create_mock_dependencies({
      organization_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: [], total_count: 99 },
        }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
    });
    const filters = {
      organization_scope_state: {
        status: "scoped",
        organization_id: "org_1",
      },
      fixture_status: "scheduled",
      organization_count_state: { status: "fixed", value: 1 },
    } as DashboardFilters;

    const result = await load_dashboard_data(dependencies, filters);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.stats.organizations).toBe(1);
  });
});
