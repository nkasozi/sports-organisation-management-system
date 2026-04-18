import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_competition_results_page_controller_runtime } from "./competitionResultsPageControllerRuntime";

const {
  create_empty_competition_results_bundle_mock,
  derive_competition_results_can_change_organizations_mock,
  ensure_auth_profile_mock,
  extract_competition_results_url_params_mock,
  fetch_public_data_from_convex_mock,
  find_competition_results_organization_mock,
  initialize_competition_results_page_mock,
  load_competition_results_bundle_mock,
  load_competitions_for_results_organization_mock,
} = vi.hoisted(() => ({
  create_empty_competition_results_bundle_mock: vi.fn(),
  derive_competition_results_can_change_organizations_mock: vi.fn(),
  ensure_auth_profile_mock: vi.fn(),
  extract_competition_results_url_params_mock: vi.fn(),
  fetch_public_data_from_convex_mock: vi.fn(),
  find_competition_results_organization_mock: vi.fn(),
  initialize_competition_results_page_mock: vi.fn(),
  load_competition_results_bundle_mock: vi.fn(),
  load_competitions_for_results_organization_mock: vi.fn(),
}));

vi.mock("./authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

vi.mock("$lib/infrastructure/sync/convexPublicDataService", () => ({
  fetch_public_data_from_convex: fetch_public_data_from_convex_mock,
}));

vi.mock("./competitionResultsPageControllerDependencies", () => ({
  competition_results_page_dependencies: { marker: true },
}));

vi.mock("./competitionResultsPageData", () => ({
  extract_competition_results_url_params:
    extract_competition_results_url_params_mock,
}));

vi.mock("./competitionResultsPageInitialization", () => ({
  initialize_competition_results_page: initialize_competition_results_page_mock,
}));

vi.mock("./competitionResultsPageState", () => ({
  create_empty_competition_results_bundle:
    create_empty_competition_results_bundle_mock,
  derive_competition_results_can_change_organizations:
    derive_competition_results_can_change_organizations_mock,
  find_competition_results_organization:
    find_competition_results_organization_mock,
  load_competition_results_bundle: load_competition_results_bundle_mock,
  load_competitions_for_results_organization:
    load_competitions_for_results_organization_mock,
}));

describe("competitionResultsPageControllerRuntime", () => {
  function create_command() {
    const state = {
      organizations: [{ id: "organization-1", name: "Org One" }],
      selected_competition_id: "competition-1",
      selected_organization_id: "organization-1",
    };

    const command = {
      apply_bundle: vi.fn(),
      get_auth_state: () => ({
        current_profile_state: {
          status: "present",
          profile: { organization_id: "organization-1" },
        },
      }),
      get_is_public: () => true,
      get_organizations: () => state.organizations as never,
      get_page_url: () => new URL("https://example.com/competition-results"),
      get_saved_organization_id: () => "organization-1",
      get_selected_competition_id: () => state.selected_competition_id,
      get_selected_organization_id: () => state.selected_organization_id,
      is_browser: true,
      set_can_change_organizations: vi.fn(),
      set_competitions: vi.fn(),
      set_error_message: vi.fn(),
      set_fixtures_loading: vi.fn(),
      set_is_using_cached_data: vi.fn(),
      set_loading_state: vi.fn(),
      set_organizations: vi.fn((value: unknown[]) => {
        state.organizations = value as never;
      }),
      set_selected_competition_id: vi.fn((value: string) => {
        state.selected_competition_id = value;
      }),
      set_selected_organization_id: vi.fn((value: string) => {
        state.selected_organization_id = value;
      }),
      sync_branding_for_org: vi.fn().mockImplementation(async () => {}),
      sync_public_organization: vi.fn().mockImplementation(async () => {}),
    };

    return { command, state };
  }

  beforeEach(() => {
    create_empty_competition_results_bundle_mock.mockReset();
    derive_competition_results_can_change_organizations_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    extract_competition_results_url_params_mock.mockReset();
    fetch_public_data_from_convex_mock.mockReset();
    find_competition_results_organization_mock.mockReset();
    initialize_competition_results_page_mock.mockReset();
    load_competition_results_bundle_mock.mockReset();
    load_competitions_for_results_organization_mock.mockReset();
  });

  it("loads the selected competition bundle on demand", async () => {
    const { command } = create_command();
    load_competition_results_bundle_mock.mockResolvedValueOnce({
      fixture_count: 2,
    });

    await create_competition_results_page_controller_runtime(
      command as never,
    ).load_competition_data();
    expect(command.apply_bundle).toHaveBeenCalledWith({ fixture_count: 2 });
  });

  it("reloads the selected organization and syncs public branding when the organization changes", async () => {
    const { command } = create_command();
    extract_competition_results_url_params_mock.mockReturnValueOnce({
      org_id: "",
      competition_id: "",
    });
    find_competition_results_organization_mock.mockReturnValueOnce({
      status: "present",
      organization: {
        id: "organization-1",
        name: "Org One",
      },
    });
    load_competitions_for_results_organization_mock.mockResolvedValueOnce({
      competitions: [{ id: "competition-2" }],
      selected_competition_id: "competition-2",
      bundle: { fixture_count: 3 },
    });

    await create_competition_results_page_controller_runtime(
      command as never,
    ).handle_organization_change();
    expect(command.sync_public_organization).toHaveBeenCalledWith({
      id: "organization-1",
      name: "Org One",
    });
    expect(command.sync_branding_for_org).toHaveBeenCalledWith({
      id: "organization-1",
      name: "Org One",
    });
    expect(command.set_competitions).toHaveBeenCalledWith([
      { id: "competition-2" },
    ]);
    expect(command.set_selected_competition_id).toHaveBeenCalledWith(
      "competition-2",
    );
    expect(command.apply_bundle).toHaveBeenCalledWith({ fixture_count: 3 });
  });

  it("stops private-page initialization when auth fails", async () => {
    const { command } = create_command();
    ensure_auth_profile_mock.mockResolvedValueOnce({
      success: false,
      error_message: "Access denied",
    });
    extract_competition_results_url_params_mock.mockReturnValueOnce({
      org_id: "",
      competition_id: "",
    });

    await create_competition_results_page_controller_runtime({
      ...command,
      get_is_public: () => false,
    } as never).initialize_page();

    expect(command.set_error_message).toHaveBeenCalledWith("Access denied");
    expect(command.set_loading_state).toHaveBeenCalledWith("error");
  });

  it("initializes the page state from the loaded competition results payload", async () => {
    const { command } = create_command();
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    extract_competition_results_url_params_mock.mockReturnValueOnce({
      org_id: "organization-1",
      competition_id: "competition-1",
    });
    derive_competition_results_can_change_organizations_mock.mockReturnValueOnce(
      true,
    );
    initialize_competition_results_page_mock.mockResolvedValueOnce({
      is_using_cached_data: false,
      organizations: [{ id: "organization-1" }],
      selected_organization_id: "organization-1",
      competitions: [{ id: "competition-1" }],
      selected_competition_id: "competition-1",
      bundle: { fixture_count: 5 },
    });

    await create_competition_results_page_controller_runtime(
      command as never,
    ).initialize_page();

    expect(
      derive_competition_results_can_change_organizations_mock,
    ).toHaveBeenCalledWith(
      {
        status: "present",
        profile: { organization_id: "organization-1" },
      },
      "organization-1",
    );
    expect(command.set_can_change_organizations).toHaveBeenCalledWith(true);
    expect(command.set_is_using_cached_data).toHaveBeenCalledWith(false);
    expect(command.set_organizations).toHaveBeenCalledWith([
      { id: "organization-1" },
    ]);
    expect(command.apply_bundle).toHaveBeenCalledWith({ fixture_count: 5 });
    expect(command.set_loading_state).toHaveBeenLastCalledWith("success");
  });

  it("falls back to an empty bundle when initialization throws", async () => {
    const { command } = create_command();
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    extract_competition_results_url_params_mock.mockReturnValueOnce({
      org_id: "organization-1",
      competition_id: "competition-1",
    });
    derive_competition_results_can_change_organizations_mock.mockReturnValueOnce(
      true,
    );
    initialize_competition_results_page_mock.mockRejectedValueOnce(
      new Error("boom"),
    );
    create_empty_competition_results_bundle_mock.mockReturnValueOnce({
      empty: true,
    });

    await create_competition_results_page_controller_runtime(
      command as never,
    ).initialize_page();

    expect(command.set_error_message).toHaveBeenCalledWith("boom");
    expect(command.set_loading_state).toHaveBeenLastCalledWith("error");
    expect(command.apply_bundle).toHaveBeenCalledWith({ empty: true });
  });
});
