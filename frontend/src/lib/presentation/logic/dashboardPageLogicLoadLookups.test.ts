import { describe, expect, it, vi } from "vitest";

import { load_dashboard_data } from "./dashboardPageLogic";
import {
  create_default_filters,
  create_mock_dependencies,
} from "./dashboardPageLogic.test_support";

describe("load_dashboard_data", () => {
  it("populates teams_map from team results", async () => {
    const dependencies = create_mock_dependencies({
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
              {
                id: "team_2",
                name: "Lions",
                short_name: "LNS",
                organization_id: "org_1",
              },
            ],
            total_count: 2,
          },
        }),
      },
    });
    const filters = create_default_filters();

    const result = await load_dashboard_data(dependencies, filters);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.teams_map.size).toBe(2);
    expect(result.data.teams_map.get("team_1")?.name).toBe("Eagles");
    expect(result.data.teams_map.get("team_2")?.short_name).toBe("LNS");
  });

  it("returns empty data when use cases fail", async () => {
    const dependencies = create_mock_dependencies({
      organization_use_cases: {
        list: vi.fn().mockResolvedValue({ success: false, error: "db error" }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
      competition_use_cases: {
        list: vi.fn().mockResolvedValue({ success: false, error: "db error" }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
      team_use_cases: {
        list: vi.fn().mockResolvedValue({ success: false, error: "db error" }),
      },
      player_use_cases: {
        list: vi.fn().mockResolvedValue({ success: false, error: "db error" }),
      },
      fixture_use_cases: {
        list: vi.fn().mockResolvedValue({ success: false, error: "db error" }),
      },
    });
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
    expect(result.data.recent_competitions).toEqual([]);
    expect(result.data.upcoming_fixtures).toEqual([]);
  });

  it("resolves sport names for competitions via org lookup", async () => {
    const dependencies = create_mock_dependencies({
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
            total_count: 1,
          },
        }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
      organization_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: [], total_count: 1 },
        }),
        get_by_id: vi.fn().mockResolvedValue({
          success: true,
          data: { id: "org_1", name: "Test Org", sport_id: "sport_1" },
        }),
      },
      sport_use_cases: {
        get_by_id: vi.fn().mockResolvedValue({
          success: true,
          data: { id: "sport_1", name: "Hockey" },
        }),
      },
    });
    const filters = create_default_filters();

    const result = await load_dashboard_data(dependencies, filters);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.competition_sport_names["comp_1"]).toBe("Hockey");
  });
});
