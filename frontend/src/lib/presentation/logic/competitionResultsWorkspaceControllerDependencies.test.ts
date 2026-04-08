import { describe, expect, it, vi } from "vitest";

const competition_results_workspace_dependency_mocks = vi.hoisted(() => ({
  get_competition_use_cases: vi.fn(),
  get_fixture_lineup_use_cases: vi.fn(),
  get_fixture_use_cases: vi.fn(),
  get_official_use_cases: vi.fn(),
  get_organization_use_cases: vi.fn(),
  get_team_staff_use_cases: vi.fn(),
  get_team_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_use_cases:
    competition_results_workspace_dependency_mocks.get_competition_use_cases,
  get_fixture_lineup_use_cases:
    competition_results_workspace_dependency_mocks.get_fixture_lineup_use_cases,
  get_fixture_use_cases:
    competition_results_workspace_dependency_mocks.get_fixture_use_cases,
  get_official_use_cases:
    competition_results_workspace_dependency_mocks.get_official_use_cases,
  get_organization_use_cases:
    competition_results_workspace_dependency_mocks.get_organization_use_cases,
  get_team_staff_use_cases:
    competition_results_workspace_dependency_mocks.get_team_staff_use_cases,
  get_team_use_cases:
    competition_results_workspace_dependency_mocks.get_team_use_cases,
}));

describe("competitionResultsWorkspaceControllerDependencies", () => {
  it("assembles workspace and match-report dependencies from the correct factories", async () => {
    vi.resetModules();
    const expected_workspace_dependencies = {
      fixture_use_cases: { kind: "fixtures" },
      team_use_cases: { kind: "teams" },
      competition_use_cases: { kind: "competitions" },
    };
    const expected_match_report_dependencies = {
      fixture_lineup_use_cases: { kind: "fixture-lineups" },
      official_use_cases: { kind: "officials" },
      organization_use_cases: { kind: "organizations" },
      team_staff_use_cases: { kind: "team-staff" },
    };
    competition_results_workspace_dependency_mocks.get_fixture_use_cases.mockReturnValue(
      expected_workspace_dependencies.fixture_use_cases,
    );
    competition_results_workspace_dependency_mocks.get_team_use_cases.mockReturnValue(
      expected_workspace_dependencies.team_use_cases,
    );
    competition_results_workspace_dependency_mocks.get_competition_use_cases.mockReturnValue(
      expected_workspace_dependencies.competition_use_cases,
    );
    competition_results_workspace_dependency_mocks.get_fixture_lineup_use_cases.mockReturnValue(
      expected_match_report_dependencies.fixture_lineup_use_cases,
    );
    competition_results_workspace_dependency_mocks.get_official_use_cases.mockReturnValue(
      expected_match_report_dependencies.official_use_cases,
    );
    competition_results_workspace_dependency_mocks.get_organization_use_cases.mockReturnValue(
      expected_match_report_dependencies.organization_use_cases,
    );
    competition_results_workspace_dependency_mocks.get_team_staff_use_cases.mockReturnValue(
      expected_match_report_dependencies.team_staff_use_cases,
    );

    const {
      competition_results_match_report_dependencies,
      competition_results_workspace_dependencies,
    } = await import("./competitionResultsWorkspaceControllerDependencies");

    expect(competition_results_workspace_dependencies).toEqual(
      expected_workspace_dependencies,
    );
    expect(competition_results_match_report_dependencies).toEqual(
      expected_match_report_dependencies,
    );
  });
});
