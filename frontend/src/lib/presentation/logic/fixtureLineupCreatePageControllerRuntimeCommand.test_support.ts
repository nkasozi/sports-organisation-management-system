import { type Mock, vi } from "vitest";

import { create_runtime_command_untracked_setters } from "./fixtureLineupCreatePageControllerRuntimeUntrackedSetters.test_support";

type RuntimeCommandState = {
  confirm_lock_understood: boolean;
  current_step_index: number;
  error_message: string;
  fixtures_with_complete_lineups: Set<string>;
  form_data: {
    organization_id: string;
    fixture_id: string;
    team_id: string;
    selected_players: unknown[];
  };
  loading: boolean;
  max_players: number;
  min_players: number;
  organizations: { id: string; name: string }[];
  player_search_text: string;
  saving: boolean;
  selected_fixture_state: unknown;
  selected_organization_state: unknown;
  selected_team_state: unknown;
  team_players: unknown[];
  validation_errors: Record<string, string>;
};

function create_runtime_command_state(): RuntimeCommandState {
  return {
    confirm_lock_understood: true,
    current_step_index: 0,
    error_message: "old error",
    fixtures_with_complete_lineups: new Set<string>(),
    form_data: {
      organization_id: "",
      fixture_id: "",
      team_id: "",
      selected_players: [],
    },
    loading: true,
    max_players: 18,
    min_players: 2,
    organizations: [{ id: "organization-1", name: "Premier League" }],
    player_search_text: "keeper",
    saving: false,
    selected_fixture_state: { status: "missing" } as unknown,
    selected_organization_state: { status: "missing" } as unknown,
    selected_team_state: { status: "missing" } as unknown,
    team_players: [] as unknown[],
    validation_errors: { players: "old" } as Record<string, string>,
  };
}

function create_runtime_command_getters(state: RuntimeCommandState): {
  dependencies: never;
  get_confirm_lock_understood: () => boolean;
  get_current_auth_profile_state: () => { status: "missing" };
  get_fixtures_with_complete_lineups: () => Set<string>;
  get_form_data: () => never;
  get_max_players: () => number;
  get_min_players: () => number;
  get_organization_is_restricted: () => boolean;
  get_organizations: () => never;
  get_selected_fixture_state: () => never;
  get_selected_organization_state: () => never;
  get_selected_team_state: () => never;
  get_team_players: () => never;
  goto: Mock;
  is_browser: boolean;
} {
  return {
    dependencies: {} as never,
    get_confirm_lock_understood: () => state.confirm_lock_understood,
    get_current_auth_profile_state: () => ({ status: "missing" as const }),
    get_fixtures_with_complete_lineups: () =>
      state.fixtures_with_complete_lineups,
    get_form_data: () => state.form_data as never,
    get_max_players: () => state.max_players,
    get_min_players: () => state.min_players,
    get_organization_is_restricted: () => false,
    get_organizations: () => state.organizations as never,
    get_selected_fixture_state: () => state.selected_fixture_state as never,
    get_selected_organization_state: () =>
      state.selected_organization_state as never,
    get_selected_team_state: () => state.selected_team_state as never,
    get_team_players: () => state.team_players as never,
    goto: vi.fn(async () => {}),
    is_browser: true,
  };
}

function create_runtime_command_scalar_setters(state: RuntimeCommandState): {
  set_confirm_lock_understood: Mock;
  set_current_step_index: Mock;
  set_error_message: Mock;
  set_loading: Mock;
  set_max_players: Mock;
  set_min_players: Mock;
  set_player_search_text: Mock;
  set_saving: Mock;
} {
  return {
    set_confirm_lock_understood: vi.fn((value: boolean) => {
      state.confirm_lock_understood = value;
    }),
    set_current_step_index: vi.fn((value: number) => {
      state.current_step_index = value;
    }),
    set_error_message: vi.fn((value: string) => {
      state.error_message = value;
    }),
    set_loading: vi.fn((value: boolean) => {
      state.loading = value;
    }),
    set_max_players: vi.fn((value: number) => {
      state.max_players = value;
    }),
    set_min_players: vi.fn((value: number) => {
      state.min_players = value;
    }),
    set_player_search_text: vi.fn((value: string) => {
      state.player_search_text = value;
    }),
    set_saving: vi.fn((value: boolean) => {
      state.saving = value;
    }),
  };
}

function create_runtime_command_selection_setters(state: RuntimeCommandState): {
  set_fixtures_with_complete_lineups: Mock;
  set_form_data: Mock;
  set_selected_fixture_state: Mock;
  set_selected_organization_state: Mock;
  set_selected_team_state: Mock;
  set_team_players: Mock;
  set_validation_errors: Mock;
} {
  return {
    set_fixtures_with_complete_lineups: vi.fn((value: Set<string>) => {
      state.fixtures_with_complete_lineups = value;
    }),
    set_form_data: vi.fn((value: typeof state.form_data) => {
      state.form_data = value;
    }),
    set_selected_fixture_state: vi.fn((value: unknown) => {
      state.selected_fixture_state = value;
    }),
    set_selected_organization_state: vi.fn((value: unknown) => {
      state.selected_organization_state = value;
    }),
    set_selected_team_state: vi.fn((value: unknown) => {
      state.selected_team_state = value;
    }),
    set_team_players: vi.fn((value: unknown[]) => {
      state.team_players = value;
    }),
    set_validation_errors: vi.fn((value: Record<string, string>) => {
      state.validation_errors = value;
    }),
  };
}

type RuntimeCommand = ReturnType<typeof create_runtime_command_getters> &
  ReturnType<typeof create_runtime_command_scalar_setters> &
  ReturnType<typeof create_runtime_command_selection_setters> &
  ReturnType<typeof create_runtime_command_untracked_setters>;

export function create_command(): {
  command: RuntimeCommand;
  state: RuntimeCommandState;
} {
  const state = create_runtime_command_state();
  const command = {
    ...create_runtime_command_getters(state),
    ...create_runtime_command_scalar_setters(state),
    ...create_runtime_command_selection_setters(state),
    ...create_runtime_command_untracked_setters(),
  };

  return { command, state };
}
