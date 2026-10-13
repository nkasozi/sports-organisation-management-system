import { type Mock, vi } from "vitest";

type ResultsCommandState = {
  organizations: { id: string; name: string }[];
  selected_competition_id: string;
  selected_organization_id: string;
};

type ResultsCommandGetters = {
  get_auth_state: () => unknown;
  get_is_public: () => boolean;
  get_organizations: () => never;
  get_page_url: () => URL;
  get_saved_organization_id: () => string;
  get_selected_competition_id: () => string;
  get_selected_organization_id: () => string;
  is_browser: boolean;
};

type ResultsCommandSetters = {
  apply_bundle: Mock;
  set_can_change_organizations: Mock;
  set_competitions: Mock;
  set_error_message: Mock;
  set_fixtures_loading: Mock;
  set_is_using_cached_data: Mock;
  set_loading_state: Mock;
  set_organizations: Mock;
  set_selected_competition_id: Mock;
  set_selected_organization_id: Mock;
  sync_branding_for_org: Mock;
  sync_public_organization: Mock;
};

type ResultsTestCommand = ResultsCommandGetters & ResultsCommandSetters;

type ResultsTestContext = {
  command: ResultsTestCommand;
  state: ResultsCommandState;
};

function create_command_getters(
  state: ResultsCommandState,
): ResultsCommandGetters {
  return {
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
  };
}

function create_command_setters(
  state: ResultsCommandState,
): ResultsCommandSetters {
  return {
    apply_bundle: vi.fn(),
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
}

export function create_command(): ResultsTestContext {
  const state: ResultsCommandState = {
    organizations: [{ id: "organization-1", name: "Org One" }],
    selected_competition_id: "competition-1",
    selected_organization_id: "organization-1",
  };
  const command: ResultsTestCommand = {
    ...create_command_getters(state),
    ...create_command_setters(state),
  };
  return { command, state };
}
