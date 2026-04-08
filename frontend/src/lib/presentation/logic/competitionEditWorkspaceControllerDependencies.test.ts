import { describe, expect, it, vi } from "vitest";

const competition_edit_workspace_dependency_mocks = vi.hoisted(() => ({
  get_competition_team_use_cases: vi.fn(),
  get_competition_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_team_use_cases:
    competition_edit_workspace_dependency_mocks.get_competition_team_use_cases,
  get_competition_use_cases:
    competition_edit_workspace_dependency_mocks.get_competition_use_cases,
}));

describe("competitionEditWorkspaceControllerDependencies", () => {
  it("assembles competition edit workspace dependencies from the factory outputs", async () => {
    vi.resetModules();
    const expected_dependencies = {
      competition_use_cases: { kind: "competitions" },
      competition_team_use_cases: { kind: "competition-teams" },
    };
    competition_edit_workspace_dependency_mocks.get_competition_use_cases.mockReturnValue(
      expected_dependencies.competition_use_cases,
    );
    competition_edit_workspace_dependency_mocks.get_competition_team_use_cases.mockReturnValue(
      expected_dependencies.competition_team_use_cases,
    );

    const { competition_edit_workspace_dependencies } =
      await import("./competitionEditWorkspaceControllerDependencies");

    expect(competition_edit_workspace_dependencies).toEqual(
      expected_dependencies,
    );
  });
});
