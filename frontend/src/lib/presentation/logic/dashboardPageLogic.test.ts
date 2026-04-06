import { describe, it, expect, vi } from "vitest";
import {
  load_dashboard_data,
  get_competition_initials,
  split_organization_name,
  get_status_class,
  format_fixture_date,
} from "./dashboardPageLogic";
import type { DashboardDependencies } from "./dashboardPageLogic";
import type { DashboardFilters } from "./dashboardStatsLogic";

function create_mock_dependencies(
  overrides: Partial<DashboardDependencies> = {},
): DashboardDependencies {
  return {
    organization_use_cases: {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [], total_count: 0 },
      }),
      get_by_id: vi.fn().mockResolvedValue({
        success: false,
        error: "not found",
      }),
    },
    competition_use_cases: {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [], total_count: 0 },
      }),
      get_by_id: vi.fn().mockResolvedValue({
        success: false,
        error: "not found",
      }),
    },
    team_use_cases: {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [], total_count: 0 },
      }),
    },
    player_use_cases: {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [], total_count: 0 },
      }),
    },
    fixture_use_cases: {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [], total_count: 0 },
      }),
    },
    sport_use_cases: {
      get_by_id: vi.fn().mockResolvedValue({
        success: false,
        error: "not found",
      }),
    },
    ...overrides,
  };
}

function create_default_filters(): DashboardFilters {
  return {
    organization_filter: undefined,
    fixture_filter: { status: "scheduled" },
    organization_count_override: null,
  };
}

describe("get_competition_initials", () => {
  it("returns first letter of each word uppercased", () => {
    expect(get_competition_initials("Premier League")).toBe("PL");
  });

  it("truncates to two characters", () => {
    expect(get_competition_initials("The Big Championship League")).toBe("TB");
  });

  it("handles single word", () => {
    expect(get_competition_initials("Cup")).toBe("C");
  });
});

describe("split_organization_name", () => {
  it("splits two-word name into prefix and suffix", () => {
    const result = split_organization_name("Field Hockey");
    expect(result).toEqual({
      prefix: "Field",
      suffix: "Hockey",
      remainder: "",
    });
  });

  it("handles single word name", () => {
    const result = split_organization_name("FIFA");
    expect(result).toEqual({ prefix: "", suffix: "FIFA", remainder: "" });
  });

  it("puts extra words into remainder", () => {
    const result = split_organization_name("United States Federation");
    expect(result).toEqual({
      prefix: "United",
      suffix: "States",
      remainder: "Federation",
    });
  });
});

describe("get_status_class", () => {
  it("returns status-active for active status", () => {
    expect(get_status_class("active")).toBe("status-active");
  });

  it("returns status-active for in_progress status", () => {
    expect(get_status_class("in_progress")).toBe("status-active");
  });

  it("returns status-warning for upcoming status", () => {
    expect(get_status_class("upcoming")).toBe("status-warning");
  });

  it("returns status-warning for scheduled status", () => {
    expect(get_status_class("scheduled")).toBe("status-warning");
  });

  it("returns status-inactive for completed status", () => {
    expect(get_status_class("completed")).toBe("status-inactive");
  });

  it("returns status-inactive for unknown status", () => {
    expect(get_status_class("unknown_value")).toBe("status-inactive");
  });
});

describe("format_fixture_date", () => {
  it("formats a regular date with time", () => {
    const far_future_date = "2099-06-15";
    const result = format_fixture_date(far_future_date, "14:00");
    expect(result).toContain("14:00");
    expect(result).toContain("Jun");
  });

  it("uses TBD when scheduled_time is empty", () => {
    const result = format_fixture_date("2099-06-15", "");
    expect(result).toContain("TBD");
  });
});

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
    const filters: DashboardFilters = {
      organization_filter: { organization_id: "org_1" },
      fixture_filter: { status: "scheduled", organization_id: "org_1" },
      organization_count_override: 1,
    };

    const result = await load_dashboard_data(dependencies, filters);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.stats.organizations).toBe(1);
  });

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
        list: vi
          .fn()
          .mockResolvedValue({ success: false, error: "db error" }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
      competition_use_cases: {
        list: vi
          .fn()
          .mockResolvedValue({ success: false, error: "db error" }),
        get_by_id: vi.fn().mockResolvedValue({
          success: false,
          error: "not found",
        }),
      },
      team_use_cases: {
        list: vi
          .fn()
          .mockResolvedValue({ success: false, error: "db error" }),
      },
      player_use_cases: {
        list: vi
          .fn()
          .mockResolvedValue({ success: false, error: "db error" }),
      },
      fixture_use_cases: {
        list: vi
          .fn()
          .mockResolvedValue({ success: false, error: "db error" }),
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
