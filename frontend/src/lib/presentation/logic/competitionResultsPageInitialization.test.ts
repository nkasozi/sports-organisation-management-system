import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialize_competition_results_page } from "./competitionResultsPageInitialization";

const {
  create_empty_competition_results_bundle_mock,
  find_competition_results_competition_mock,
  find_competition_results_organization_mock,
  load_competition_results_bundle_mock,
  load_competition_results_organizations_mock,
  load_competitions_for_results_organization_mock,
  select_preferred_results_organization_mock,
} = vi.hoisted(() => ({
  create_empty_competition_results_bundle_mock: vi.fn(),
  find_competition_results_competition_mock: vi.fn(),
  find_competition_results_organization_mock: vi.fn(),
  load_competition_results_bundle_mock: vi.fn(),
  load_competition_results_organizations_mock: vi.fn(),
  load_competitions_for_results_organization_mock: vi.fn(),
  select_preferred_results_organization_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionResultsPageData", () => ({
  load_competition_results_organizations:
    load_competition_results_organizations_mock,
}));

vi.mock("$lib/presentation/logic/competitionResultsPageState", () => ({
  create_empty_competition_results_bundle:
    create_empty_competition_results_bundle_mock,
  find_competition_results_competition:
    find_competition_results_competition_mock,
  find_competition_results_organization:
    find_competition_results_organization_mock,
  load_competition_results_bundle: load_competition_results_bundle_mock,
  load_competitions_for_results_organization:
    load_competitions_for_results_organization_mock,
  select_preferred_results_organization:
    select_preferred_results_organization_mock,
}));

describe("competitionResultsPageInitialization", () => {
  beforeEach(() => {
    create_empty_competition_results_bundle_mock.mockReset();
    find_competition_results_competition_mock.mockReset();
    find_competition_results_organization_mock.mockReset();
    load_competition_results_bundle_mock.mockReset();
    load_competition_results_organizations_mock.mockReset();
    load_competitions_for_results_organization_mock.mockReset();
    select_preferred_results_organization_mock.mockReset();
    create_empty_competition_results_bundle_mock.mockReturnValue({
      empty: true,
    });
  });

  it("uses the URL-selected organization and competition when both resolve", async () => {
    const organization = { id: "organization-1", name: "Org One" };
    const competition = { id: "competition-2", name: "Cup Final" };
    const organization_use_cases = { kind: "organizations" } as never;
    const competition_results_dependencies = {
      organization_use_cases,
    } as never;
    load_competition_results_organizations_mock.mockResolvedValueOnce([
      organization,
    ]);
    find_competition_results_organization_mock.mockReturnValueOnce({
      status: "present",
      organization,
    });
    load_competitions_for_results_organization_mock.mockResolvedValueOnce({
      competitions: [competition],
      selected_competition_id: "competition-1",
      bundle: { fixture_count: 1 },
    });
    find_competition_results_competition_mock.mockReturnValueOnce({
      status: "present",
      competition,
    });
    load_competition_results_bundle_mock.mockResolvedValueOnce({
      fixture_count: 2,
    });

    await expect(
      initialize_competition_results_page({
        current_profile_state: { status: "missing" },
        competition_results_dependencies,
        url_params: {
          org_id: "organization-1",
          competition_id: "competition-2",
        },
        is_public: true,
        saved_organization_id: "",
        sync_public_organization: vi.fn().mockImplementation(async () => {}),
        load_public_data: vi.fn().mockResolvedValue({ success: true }),
      }),
    ).resolves.toEqual({
      is_using_cached_data: false,
      organizations: [organization],
      selected_organization_id: "organization-1",
      competitions: [competition],
      selected_competition_id: "competition-2",
      bundle: { fixture_count: 2 },
    });
    expect(load_competition_results_organizations_mock).toHaveBeenCalledWith(
      { status: "missing" },
      organization_use_cases,
    );
  });

  it("falls back to the saved organization when no URL organization matches", async () => {
    const organization = { id: "organization-2", name: "Org Two" };
    const organization_use_cases = { kind: "organizations" } as never;
    const competition_results_dependencies = {
      organization_use_cases,
    } as never;
    load_competition_results_organizations_mock.mockResolvedValueOnce([
      organization,
    ]);
    select_preferred_results_organization_mock.mockReturnValueOnce({
      status: "present",
      organization,
    });
    load_competitions_for_results_organization_mock.mockResolvedValueOnce({
      competitions: [{ id: "competition-3" }],
      selected_competition_id: "competition-3",
      bundle: { fixture_count: 3 },
    });

    await expect(
      initialize_competition_results_page({
        current_profile_state: { status: "missing" },
        competition_results_dependencies,
        url_params: { org_id: "", competition_id: "" },
        is_public: true,
        saved_organization_id: "organization-2",
        sync_public_organization: vi.fn().mockImplementation(async () => {}),
        load_public_data: vi.fn().mockResolvedValue({ success: false }),
      }),
    ).resolves.toEqual({
      is_using_cached_data: true,
      organizations: [organization],
      selected_organization_id: "organization-2",
      competitions: [{ id: "competition-3" }],
      selected_competition_id: "competition-3",
      bundle: { fixture_count: 3 },
    });
    expect(load_competition_results_organizations_mock).toHaveBeenCalledWith(
      { status: "missing" },
      organization_use_cases,
    );
  });
});
