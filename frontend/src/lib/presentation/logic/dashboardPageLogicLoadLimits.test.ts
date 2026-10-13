import { describe, expect, it, vi } from "vitest";

import { load_dashboard_data } from "./dashboardPageLogic";
import {
  create_default_filters,
  create_mock_dependencies,
} from "./dashboardPageLogic.test_support";

describe("load_dashboard_data", () => {
  it("sorts upcoming fixtures by scheduled_date ascending", async () => {
    const dependencies = create_mock_dependencies({
      fixture_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: {
            items: [
              {
                id: "fix_2",
                competition_id: "comp_1",
                home_team_id: "t1",
                away_team_id: "t2",
                scheduled_date: "2099-06-20",
                scheduled_time: "15:00",
                venue: "Stadium B",
              },
              {
                id: "fix_1",
                competition_id: "comp_1",
                home_team_id: "t1",
                away_team_id: "t2",
                scheduled_date: "2099-06-10",
                scheduled_time: "14:00",
                venue: "Stadium A",
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
    expect(result.data.upcoming_fixtures[0].id).toBe("fix_1");
    expect(result.data.upcoming_fixtures[1].id).toBe("fix_2");
  });

  it("limits recent competitions to 3", async () => {
    const five_competitions = Array.from({ length: 5 }, (_, index) => ({
      id: `comp_${index}`,
      name: `Competition ${index}`,
      organization_id: "org_1",
      status: "active",
      team_ids: [],
    }));
    const dependencies = create_mock_dependencies({
      competition_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: five_competitions, total_count: 5 },
        }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
    });
    const filters = create_default_filters();

    const result = await load_dashboard_data(dependencies, filters);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.recent_competitions.length).toBe(3);
  });

  it("limits upcoming fixtures to 3", async () => {
    const five_fixtures = Array.from({ length: 5 }, (_, index) => ({
      id: `fix_${index}`,
      competition_id: "comp_1",
      home_team_id: "t1",
      away_team_id: "t2",
      scheduled_date: `2099-06-${10 + index}`,
      scheduled_time: "14:00",
      venue: "Stadium",
    }));
    const dependencies = create_mock_dependencies({
      fixture_use_cases: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: { items: five_fixtures, total_count: 5 },
        }),
      },
    });
    const filters = create_default_filters();

    const result = await load_dashboard_data(dependencies, filters);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.upcoming_fixtures.length).toBe(3);
  });
});
