import { describe, expect, it, vi } from "vitest";

const official_leaderboard_page_dependency_mocks = vi.hoisted(() => ({
  get_competition_stage_use_cases: vi.fn(),
  get_fixture_use_cases: vi.fn(),
  get_official_performance_rating_use_cases: vi.fn(),
  get_official_use_cases: vi.fn(),
  get_organization_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_stage_use_cases:
    official_leaderboard_page_dependency_mocks.get_competition_stage_use_cases,
  get_fixture_use_cases:
    official_leaderboard_page_dependency_mocks.get_fixture_use_cases,
  get_official_performance_rating_use_cases:
    official_leaderboard_page_dependency_mocks.get_official_performance_rating_use_cases,
  get_official_use_cases:
    official_leaderboard_page_dependency_mocks.get_official_use_cases,
  get_organization_use_cases:
    official_leaderboard_page_dependency_mocks.get_organization_use_cases,
}));

describe("officialLeaderboardPageDependencies", () => {
  it("assembles official leaderboard dependencies from registry factories", async () => {
    vi.resetModules();
    const expected_dependencies = {
      organization_use_cases: { kind: "organizations" },
      official_performance_rating_use_cases: {
        kind: "official-performance-ratings",
      },
      official_use_cases: { kind: "officials" },
      fixture_use_cases: { kind: "fixtures" },
      competition_stage_use_cases: { kind: "competition-stages" },
    };
    official_leaderboard_page_dependency_mocks.get_organization_use_cases.mockReturnValue(
      expected_dependencies.organization_use_cases,
    );
    official_leaderboard_page_dependency_mocks.get_official_performance_rating_use_cases.mockReturnValue(
      expected_dependencies.official_performance_rating_use_cases,
    );
    official_leaderboard_page_dependency_mocks.get_official_use_cases.mockReturnValue(
      expected_dependencies.official_use_cases,
    );
    official_leaderboard_page_dependency_mocks.get_fixture_use_cases.mockReturnValue(
      expected_dependencies.fixture_use_cases,
    );
    official_leaderboard_page_dependency_mocks.get_competition_stage_use_cases.mockReturnValue(
      expected_dependencies.competition_stage_use_cases,
    );

    const { official_leaderboard_page_dependencies } =
      await import("./officialLeaderboardPageDependencies");

    expect(official_leaderboard_page_dependencies).toEqual(
      expected_dependencies,
    );
  });
});
