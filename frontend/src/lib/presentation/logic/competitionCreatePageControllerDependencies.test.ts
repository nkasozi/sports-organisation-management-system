import { describe, expect, it, vi } from "vitest";

const competition_create_dependency_mocks = vi.hoisted(() => ({
  get_competition_format_use_cases: vi.fn(),
  get_competition_team_use_cases: vi.fn(),
  get_competition_use_cases: vi.fn(),
  get_organization_use_cases: vi.fn(),
  get_team_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_format_use_cases:
    competition_create_dependency_mocks.get_competition_format_use_cases,
  get_competition_team_use_cases:
    competition_create_dependency_mocks.get_competition_team_use_cases,
  get_competition_use_cases:
    competition_create_dependency_mocks.get_competition_use_cases,
  get_organization_use_cases:
    competition_create_dependency_mocks.get_organization_use_cases,
  get_team_use_cases: competition_create_dependency_mocks.get_team_use_cases,
}));

describe("competitionCreatePageControllerDependencies", () => {
  it("assembles create-page dependencies and exposes stable page text", async () => {
    vi.resetModules();
    const expected_dependencies = {
      competition_use_cases: { kind: "competitions" },
      competition_team_use_cases: { kind: "competition-teams" },
      organization_use_cases: { kind: "organizations" },
      competition_format_use_cases: { kind: "competition-formats" },
      team_use_cases: { kind: "teams" },
    };
    competition_create_dependency_mocks.get_competition_use_cases.mockReturnValue(
      expected_dependencies.competition_use_cases,
    );
    competition_create_dependency_mocks.get_competition_team_use_cases.mockReturnValue(
      expected_dependencies.competition_team_use_cases,
    );
    competition_create_dependency_mocks.get_organization_use_cases.mockReturnValue(
      expected_dependencies.organization_use_cases,
    );
    competition_create_dependency_mocks.get_competition_format_use_cases.mockReturnValue(
      expected_dependencies.competition_format_use_cases,
    );
    competition_create_dependency_mocks.get_team_use_cases.mockReturnValue(
      expected_dependencies.team_use_cases,
    );

    const { COMPETITION_CREATE_PAGE_TEXT, competition_create_dependencies } =
      await import("./competitionCreatePageControllerDependencies");

    expect(competition_create_dependencies).toEqual(expected_dependencies);
    expect(COMPETITION_CREATE_PAGE_TEXT).toEqual({
      access_denied: "You do not have permission to create competitions.",
      created: "Competition created successfully!",
      create_path: "/competitions/create",
      title: "Create Competition - Sports Management",
    });
  });
});
