import { beforeEach, describe, expect, it, vi } from "vitest";

const competition_results_page_state_mocks = vi.hoisted(() => ({
  check_data_permission: vi.fn(),
  load_competitions_by_organization: vi.fn(),
  load_selected_competition_bundle: vi.fn(),
}));

vi.mock("$lib/core/interfaces/ports", () => ({
  check_data_permission:
    competition_results_page_state_mocks.check_data_permission,
}));

vi.mock("$lib/presentation/logic/competitionResultsPageData", () => ({
  load_competitions_by_organization:
    competition_results_page_state_mocks.load_competitions_by_organization,
  load_selected_competition_bundle:
    competition_results_page_state_mocks.load_selected_competition_bundle,
}));

import {
  create_empty_competition_results_bundle,
  derive_competition_results_can_change_organizations,
  find_competition_results_competition,
  find_competition_results_organization,
  load_competition_results_bundle,
  load_competitions_for_results_organization,
  select_preferred_results_organization,
} from "./competitionResultsPageState";

describe("competitionResultsPageState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    competition_results_page_state_mocks.check_data_permission.mockReturnValue(
      false,
    );
  });

  it("creates an empty bundle and resolves organizations or competitions by id", () => {
    expect(create_empty_competition_results_bundle()).toEqual({
      selected_competition: null,
      competition_format: null,
      competition_stages: [],
      fixtures: [],
      teams: [],
      team_map: new Map(),
    });
    expect(
      find_competition_results_organization(
        [{ id: "organization-1", name: "Premier League" }] as never,
        "organization-1",
      ),
    ).toEqual({ id: "organization-1", name: "Premier League" });
    expect(
      find_competition_results_competition(
        [{ id: "competition-1", name: "League" }] as never,
        "competition-1",
      ),
    ).toEqual({ id: "competition-1", name: "League" });
  });

  it("derives organization switching rules and preferred organization selection", () => {
    expect(
      derive_competition_results_can_change_organizations(
        { organization_id: "*", role: "super_admin" } as never,
        "",
      ),
    ).toBe(true);
    expect(
      derive_competition_results_can_change_organizations(
        { organization_id: "organization-1", role: "org_admin" } as never,
        "",
      ),
    ).toBe(true);

    competition_results_page_state_mocks.check_data_permission.mockReturnValue(
      true,
    );
    expect(
      derive_competition_results_can_change_organizations(
        { organization_id: "organization-1", role: "org_admin" } as never,
        "organization-1",
      ),
    ).toBe(false);

    expect(
      select_preferred_results_organization(
        [
          { id: "organization-1", name: "Premier League" },
          { id: "organization-2", name: "Cup" },
        ] as never,
        "organization-2",
      ),
    ).toEqual({ id: "organization-2", name: "Cup" });
  });

  it("loads competitions for the selected organization and delegates bundle loading", async () => {
    const expected_bundle = {
      selected_competition: { id: "competition-1" },
      competition_format: null,
      competition_stages: [],
      fixtures: [],
      teams: [],
      team_map: new Map(),
    };
    competition_results_page_state_mocks.load_competitions_by_organization.mockResolvedValue(
      [{ id: "competition-1", name: "League" }],
    );
    competition_results_page_state_mocks.load_selected_competition_bundle.mockResolvedValue(
      expected_bundle,
    );

    expect(
      await load_competition_results_bundle({} as never, "competition-1"),
    ).toBe(expected_bundle);

    expect(
      await load_competitions_for_results_organization(
        { competition_use_cases: { kind: "competitions" } } as never,
        "organization-1",
      ),
    ).toEqual({
      competitions: [{ id: "competition-1", name: "League" }],
      selected_competition_id: "competition-1",
      bundle: expected_bundle,
    });
  });
});
