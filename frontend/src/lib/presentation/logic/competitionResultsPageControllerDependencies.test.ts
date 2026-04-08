import { describe, expect, it, vi } from "vitest";

const competition_results_page_dependency_mocks = vi.hoisted(() => ({
  get_competition_format_use_cases: vi.fn(),
  get_competition_stage_use_cases: vi.fn(),
  get_competition_team_use_cases: vi.fn(),
  get_competition_use_cases: vi.fn(),
  get_fixture_use_cases: vi.fn(),
  get_organization_use_cases: vi.fn(),
  get_team_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_format_use_cases:
    competition_results_page_dependency_mocks.get_competition_format_use_cases,
  get_competition_stage_use_cases:
    competition_results_page_dependency_mocks.get_competition_stage_use_cases,
  get_competition_team_use_cases:
    competition_results_page_dependency_mocks.get_competition_team_use_cases,
  get_competition_use_cases:
    competition_results_page_dependency_mocks.get_competition_use_cases,
  get_fixture_use_cases:
    competition_results_page_dependency_mocks.get_fixture_use_cases,
  get_organization_use_cases:
    competition_results_page_dependency_mocks.get_organization_use_cases,
  get_team_use_cases:
    competition_results_page_dependency_mocks.get_team_use_cases,
}));

describe("competitionResultsPageControllerDependencies", () => {
  it("assembles competition results page dependencies from the registry factories", async () => {
    vi.resetModules();
    const expected_dependencies = {
      organization_use_cases: { kind: "organizations" },
      competition_use_cases: { kind: "competitions" },
      format_use_cases: { kind: "competition-formats" },
      competition_stage_use_cases: { kind: "competition-stages" },
      competition_team_use_cases: { kind: "competition-teams" },
      team_use_cases: { kind: "teams" },
      fixture_use_cases: { kind: "fixtures" },
    };
    competition_results_page_dependency_mocks.get_organization_use_cases.mockReturnValue(
      expected_dependencies.organization_use_cases,
    );
    competition_results_page_dependency_mocks.get_competition_use_cases.mockReturnValue(
      expected_dependencies.competition_use_cases,
    );
    competition_results_page_dependency_mocks.get_competition_format_use_cases.mockReturnValue(
      expected_dependencies.format_use_cases,
    );
    competition_results_page_dependency_mocks.get_competition_stage_use_cases.mockReturnValue(
      expected_dependencies.competition_stage_use_cases,
    );
    competition_results_page_dependency_mocks.get_competition_team_use_cases.mockReturnValue(
      expected_dependencies.competition_team_use_cases,
    );
    competition_results_page_dependency_mocks.get_team_use_cases.mockReturnValue(
      expected_dependencies.team_use_cases,
    );
    competition_results_page_dependency_mocks.get_fixture_use_cases.mockReturnValue(
      expected_dependencies.fixture_use_cases,
    );

    const { competition_results_page_dependencies } =
      await import("./competitionResultsPageControllerDependencies");

    expect(competition_results_page_dependencies).toEqual(
      expected_dependencies,
    );
  });
});
