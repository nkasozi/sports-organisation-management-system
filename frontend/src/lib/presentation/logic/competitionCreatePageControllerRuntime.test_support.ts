import { type Mock, vi } from "vitest";

type TestCompetitionFormat = {
  id: string;
  min_teams_required: number;
  max_teams_allowed: number;
};

type TestSelectedFormatState =
  | { status: "present"; competition_format: TestCompetitionFormat }
  | { status: "missing" };

type CreateCommandState = {
  competition_formats: TestCompetitionFormat[];
  form_data: {
    organization_id: string;
    competition_format_id: string;
    rule_overrides: Record<string, unknown>;
  };
  is_loading_formats: boolean;
  is_loading_organizations: boolean;
  is_loading_teams: boolean;
  is_saving: boolean;
  organizations: { id: string; name: string }[];
  selected_format_state: TestSelectedFormatState;
  selected_team_ids: Set<string>;
  team_options: unknown[];
};

type CreateCommandGetters = {
  get_competition_formats: () => never;
  get_current_auth_profile_state: () => unknown;
  get_current_raw_token_state: () => unknown;
  get_form_data: () => never;
  get_is_team_count_valid: () => boolean;
  get_organizations: () => never;
  get_selected_format_state: () => never;
  get_selected_team_ids: () => Set<string>;
  goto: Mock;
  is_browser: boolean;
};

type CreateCommandSetters = {
  set_competition_format_options: Mock;
  set_competition_formats: Mock;
  set_error_message: Mock;
  set_form_data: Mock;
  set_is_loading_formats: Mock;
  set_is_loading_organizations: Mock;
  set_is_loading_teams: Mock;
  set_is_saving: Mock;
  set_organization_options: Mock;
  set_organizations: Mock;
  set_selected_format_state: Mock;
  set_selected_sport_state: Mock;
  set_selected_team_ids: Mock;
  set_team_options: Mock;
  show_toast: Mock;
};

type CreateTestCommand = CreateCommandGetters & CreateCommandSetters;

type CreateTestContext = {
  command: CreateTestCommand;
  state: CreateCommandState;
};

function create_initial_state(): CreateCommandState {
  return {
    competition_formats: [
      { id: "format-1", min_teams_required: 2, max_teams_allowed: 4 },
    ],
    form_data: {
      organization_id: "",
      competition_format_id: "",
      rule_overrides: {},
    },
    is_loading_formats: true,
    is_loading_organizations: true,
    is_loading_teams: true,
    is_saving: false,
    organizations: [{ id: "organization-1", name: "Premier League" }],
    selected_format_state: {
      status: "present",
      competition_format: {
        id: "format-1",
        min_teams_required: 2,
        max_teams_allowed: 4,
      },
    },
    selected_team_ids: new Set<string>(),
    team_options: [],
  };
}

function create_command_getters(
  state: CreateCommandState,
): CreateCommandGetters {
  return {
    get_competition_formats: () => state.competition_formats as never,
    get_current_auth_profile_state: () => ({
      status: "present",
      profile: { organization_id: "organization-1" } as never,
    }),
    get_current_raw_token_state: () => ({
      status: "present",
      value: "token-1",
    }),
    get_form_data: () => state.form_data as never,
    get_is_team_count_valid: () => true,
    get_organizations: () => state.organizations as never,
    get_selected_format_state: () => state.selected_format_state as never,
    get_selected_team_ids: () => state.selected_team_ids,
    goto: vi.fn(async () => {}),
    is_browser: true,
  };
}

function create_loading_setters(
  state: CreateCommandState,
): Pick<
  CreateCommandSetters,
  | "set_is_loading_formats"
  | "set_is_loading_organizations"
  | "set_is_loading_teams"
  | "set_is_saving"
> {
  return {
    set_is_loading_formats: vi.fn((value: boolean) => {
      state.is_loading_formats = value;
    }),
    set_is_loading_organizations: vi.fn((value: boolean) => {
      state.is_loading_organizations = value;
    }),
    set_is_loading_teams: vi.fn((value: boolean) => {
      state.is_loading_teams = value;
    }),
    set_is_saving: vi.fn((value: boolean) => {
      state.is_saving = value;
    }),
  };
}

function create_command_setters(
  state: CreateCommandState,
): CreateCommandSetters {
  return {
    ...create_loading_setters(state),
    set_competition_format_options: vi.fn(),
    set_competition_formats: vi.fn((value: TestCompetitionFormat[]) => {
      state.competition_formats = value;
    }),
    set_error_message: vi.fn(),
    set_form_data: vi.fn((value: CreateCommandState["form_data"]) => {
      state.form_data = value;
    }),
    set_organization_options: vi.fn(),
    set_organizations: vi.fn((value: CreateCommandState["organizations"]) => {
      state.organizations = value;
    }),
    set_selected_format_state: vi.fn((value: TestSelectedFormatState) => {
      state.selected_format_state = value;
    }),
    set_selected_sport_state: vi.fn(),
    set_selected_team_ids: vi.fn((value: Set<string>) => {
      state.selected_team_ids = value;
    }),
    set_team_options: vi.fn((value: unknown[]) => {
      state.team_options = value;
    }),
    show_toast: vi.fn(),
  };
}

export function create_command(): CreateTestContext {
  const state = create_initial_state();
  const command: CreateTestCommand = {
    ...create_command_getters(state),
    ...create_command_setters(state),
  };
  return { command, state };
}
