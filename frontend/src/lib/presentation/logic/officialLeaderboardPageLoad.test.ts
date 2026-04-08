import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  rebuild_official_leaderboard_view_mock,
  resolve_official_leaderboard_organizations_mock,
} = vi.hoisted(() => ({
  rebuild_official_leaderboard_view_mock: vi.fn(),
  resolve_official_leaderboard_organizations_mock: vi.fn(),
}));

vi.mock("./officialLeaderboardPageState", () => ({
  rebuild_official_leaderboard_view: rebuild_official_leaderboard_view_mock,
  resolve_official_leaderboard_organizations:
    resolve_official_leaderboard_organizations_mock,
}));

import { load_official_leaderboard_page_state } from "./officialLeaderboardPageLoad";

describe("officialLeaderboardPageLoad", () => {
  function create_dependencies() {
    return {
      organization_use_cases: { list: vi.fn() },
      official_performance_rating_use_cases: { list: vi.fn() },
      official_use_cases: { list: vi.fn() },
      fixture_use_cases: { list: vi.fn() },
      competition_stage_use_cases: { list: vi.fn() },
    };
  }

  beforeEach(() => {
    rebuild_official_leaderboard_view_mock.mockReset();
    resolve_official_leaderboard_organizations_mock.mockReset();
  });

  it("returns a generic load error when any required leaderboard dataset fails", async () => {
    const dependencies = create_dependencies();
    dependencies.organization_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    dependencies.official_performance_rating_use_cases.list.mockResolvedValue({
      success: false,
    });
    dependencies.official_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    dependencies.fixture_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    dependencies.competition_stage_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [] },
    });

    await expect(
      load_official_leaderboard_page_state({
        profile: null,
        dependencies: dependencies as never,
      }),
    ).resolves.toEqual({
      success: false,
      error_message: "Failed to load leaderboard data. Please try again.",
    });
  });

  it("loads all leaderboard datasets and rebuilds the selected organization view", async () => {
    const dependencies = create_dependencies();
    dependencies.organization_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "organization-1", name: "Premier League" }] },
    });
    dependencies.official_performance_rating_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "rating-1" }] },
    });
    dependencies.official_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "official-1" }] },
    });
    dependencies.fixture_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "fixture-1" }] },
    });
    dependencies.competition_stage_use_cases.list.mockResolvedValue({
      success: true,
      data: { items: [{ id: "stage-1" }] },
    });
    resolve_official_leaderboard_organizations_mock.mockReturnValue([
      { id: "organization-1", name: "Premier League" },
    ]);
    rebuild_official_leaderboard_view_mock.mockReturnValue({
      leaderboard_entries: [{ official_id: "official-1" }],
      selected_entry: null,
      selected_breakdown: [],
    });

    await expect(
      load_official_leaderboard_page_state({
        profile: { official_id: "official-1" } as never,
        dependencies: dependencies as never,
      }),
    ).resolves.toEqual({
      success: true,
      data: {
        organizations: [{ id: "organization-1", name: "Premier League" }],
        selected_organization_id: "organization-1",
        user_official_id: "official-1",
        all_ratings: [{ id: "rating-1" }],
        all_officials: [{ id: "official-1" }],
        all_fixtures: [{ id: "fixture-1" }],
        all_stages: [{ id: "stage-1" }],
        leaderboard_entries: [{ official_id: "official-1" }],
        selected_entry: null,
        selected_breakdown: [],
      },
    });
    expect(rebuild_official_leaderboard_view_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        selected_organization_id: "organization-1",
        user_official_id: "official-1",
      }),
    );
  });
});
