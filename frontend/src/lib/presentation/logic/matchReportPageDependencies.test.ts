import { describe, expect, it, vi } from "vitest";

const match_report_page_dependency_mocks = vi.hoisted(() => ({
  get_competition_use_cases: vi.fn(),
  get_fixture_lineup_use_cases: vi.fn(),
  get_fixture_use_cases: vi.fn(),
  get_official_use_cases: vi.fn(),
  get_organization_use_cases: vi.fn(),
  get_sport_use_cases: vi.fn(),
  get_team_staff_use_cases: vi.fn(),
  get_team_use_cases: vi.fn(),
  get_venue_use_cases: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_competition_use_cases:
    match_report_page_dependency_mocks.get_competition_use_cases,
  get_fixture_lineup_use_cases:
    match_report_page_dependency_mocks.get_fixture_lineup_use_cases,
  get_fixture_use_cases:
    match_report_page_dependency_mocks.get_fixture_use_cases,
  get_official_use_cases:
    match_report_page_dependency_mocks.get_official_use_cases,
  get_organization_use_cases:
    match_report_page_dependency_mocks.get_organization_use_cases,
  get_sport_use_cases: match_report_page_dependency_mocks.get_sport_use_cases,
  get_team_staff_use_cases:
    match_report_page_dependency_mocks.get_team_staff_use_cases,
  get_team_use_cases: match_report_page_dependency_mocks.get_team_use_cases,
  get_venue_use_cases: match_report_page_dependency_mocks.get_venue_use_cases,
}));

describe("matchReportPageDependencies", () => {
  it("assembles the match report dependency object from use-case factories", async () => {
    vi.resetModules();
    const expected_dependencies = {
      fixture_use_cases: { kind: "fixtures" },
      team_use_cases: { kind: "teams" },
      fixture_lineup_use_cases: { kind: "fixture-lineups" },
      competition_use_cases: { kind: "competitions" },
      organization_use_cases: { kind: "organizations" },
      sport_use_cases: { kind: "sports" },
      venue_use_cases: { kind: "venues" },
      official_use_cases: { kind: "officials" },
      team_staff_use_cases: { kind: "team-staff" },
    };
    match_report_page_dependency_mocks.get_fixture_use_cases.mockReturnValue(
      expected_dependencies.fixture_use_cases,
    );
    match_report_page_dependency_mocks.get_team_use_cases.mockReturnValue(
      expected_dependencies.team_use_cases,
    );
    match_report_page_dependency_mocks.get_fixture_lineup_use_cases.mockReturnValue(
      expected_dependencies.fixture_lineup_use_cases,
    );
    match_report_page_dependency_mocks.get_competition_use_cases.mockReturnValue(
      expected_dependencies.competition_use_cases,
    );
    match_report_page_dependency_mocks.get_organization_use_cases.mockReturnValue(
      expected_dependencies.organization_use_cases,
    );
    match_report_page_dependency_mocks.get_sport_use_cases.mockReturnValue(
      expected_dependencies.sport_use_cases,
    );
    match_report_page_dependency_mocks.get_venue_use_cases.mockReturnValue(
      expected_dependencies.venue_use_cases,
    );
    match_report_page_dependency_mocks.get_official_use_cases.mockReturnValue(
      expected_dependencies.official_use_cases,
    );
    match_report_page_dependency_mocks.get_team_staff_use_cases.mockReturnValue(
      expected_dependencies.team_staff_use_cases,
    );

    const { match_report_page_dependencies } =
      await import("./matchReportPageDependencies");

    expect(match_report_page_dependencies).toEqual(expected_dependencies);
  });
});
