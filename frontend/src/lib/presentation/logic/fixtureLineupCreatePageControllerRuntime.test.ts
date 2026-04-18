import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_fixture_lineup_create_page_controller_runtime } from "./fixtureLineupCreatePageControllerRuntime";

const {
  build_fixture_lineup_create_fixture_change_state_mock,
  build_fixture_lineup_create_reference_state_mock,
  build_fixture_lineup_create_team_change_state_mock,
  get_fixture_lineup_create_validation_field_mock,
  handle_fixture_lineup_create_fixture_change_mock,
  handle_fixture_lineup_create_organization_change_mock,
  handle_fixture_lineup_create_step_change_attempt_mock,
  handle_fixture_lineup_create_team_change_mock,
  initialize_fixture_lineup_create_page_mock,
  reset_fixture_lineup_create_team_state_mock,
  select_all_fixture_lineup_create_players_mock,
  submit_fixture_lineup_create_form_mock,
  toggle_fixture_lineup_create_player_mock,
} = vi.hoisted(() => ({
  build_fixture_lineup_create_fixture_change_state_mock: vi.fn(),
  build_fixture_lineup_create_reference_state_mock: vi.fn(),
  build_fixture_lineup_create_team_change_state_mock: vi.fn(),
  get_fixture_lineup_create_validation_field_mock: vi.fn(),
  handle_fixture_lineup_create_fixture_change_mock: vi.fn(),
  handle_fixture_lineup_create_organization_change_mock: vi.fn(),
  handle_fixture_lineup_create_step_change_attempt_mock: vi.fn(),
  handle_fixture_lineup_create_team_change_mock: vi.fn(),
  initialize_fixture_lineup_create_page_mock: vi.fn(),
  reset_fixture_lineup_create_team_state_mock: vi.fn(),
  select_all_fixture_lineup_create_players_mock: vi.fn(),
  submit_fixture_lineup_create_form_mock: vi.fn(),
  toggle_fixture_lineup_create_player_mock: vi.fn(),
}));

vi.mock("./fixtureLineupCreateData", () => ({
  submit_fixture_lineup_create_form: submit_fixture_lineup_create_form_mock,
}));

vi.mock("./fixtureLineupCreatePageControllerInitialization", () => ({
  initialize_fixture_lineup_create_page:
    initialize_fixture_lineup_create_page_mock,
}));

vi.mock("./fixtureLineupCreatePageControllerUpdates", () => ({
  build_fixture_lineup_create_fixture_change_state:
    build_fixture_lineup_create_fixture_change_state_mock,
  build_fixture_lineup_create_reference_state:
    build_fixture_lineup_create_reference_state_mock,
  build_fixture_lineup_create_team_change_state:
    build_fixture_lineup_create_team_change_state_mock,
  get_fixture_lineup_create_validation_field:
    get_fixture_lineup_create_validation_field_mock,
}));

vi.mock("./fixtureLineupCreatePageFlow", () => ({
  handle_fixture_lineup_create_fixture_change:
    handle_fixture_lineup_create_fixture_change_mock,
  handle_fixture_lineup_create_organization_change:
    handle_fixture_lineup_create_organization_change_mock,
  handle_fixture_lineup_create_step_change_attempt:
    handle_fixture_lineup_create_step_change_attempt_mock,
  handle_fixture_lineup_create_team_change:
    handle_fixture_lineup_create_team_change_mock,
  reset_fixture_lineup_create_team_state:
    reset_fixture_lineup_create_team_state_mock,
  select_all_fixture_lineup_create_players:
    select_all_fixture_lineup_create_players_mock,
  toggle_fixture_lineup_create_player: toggle_fixture_lineup_create_player_mock,
}));

describe("fixtureLineupCreatePageControllerRuntime", () => {
  function create_command() {
    const state = {
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

    const command = {
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
      set_all_competitions: vi.fn(),
      set_all_teams: vi.fn(),
      set_available_teams: vi.fn(),
      set_confirm_lock_understood: vi.fn((value: boolean) => {
        state.confirm_lock_understood = value;
      }),
      set_current_step_index: vi.fn((value: number) => {
        state.current_step_index = value;
      }),
      set_error_message: vi.fn((value: string) => {
        state.error_message = value;
      }),
      set_fixture_team_label_by_team_id: vi.fn(),
      set_fixtures: vi.fn(),
      set_fixtures_with_complete_lineups: vi.fn((value: Set<string>) => {
        state.fixtures_with_complete_lineups = value;
      }),
      set_form_data: vi.fn((value: typeof state.form_data) => {
        state.form_data = value;
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
      set_organizations: vi.fn(),
      set_player_search_text: vi.fn((value: string) => {
        state.player_search_text = value;
      }),
      set_saving: vi.fn((value: boolean) => {
        state.saving = value;
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
      set_starters_count: vi.fn(),
      set_team_players: vi.fn((value: unknown[]) => {
        state.team_players = value;
      }),
      set_teams_with_existing_lineups: vi.fn(),
      set_validation_errors: vi.fn((value: Record<string, string>) => {
        state.validation_errors = value;
      }),
    };

    return { command, state };
  }

  beforeEach(() => {
    vi.useRealTimers();
    build_fixture_lineup_create_fixture_change_state_mock.mockReset();
    build_fixture_lineup_create_reference_state_mock.mockReset();
    build_fixture_lineup_create_team_change_state_mock.mockReset();
    get_fixture_lineup_create_validation_field_mock.mockReset();
    handle_fixture_lineup_create_fixture_change_mock.mockReset();
    handle_fixture_lineup_create_organization_change_mock.mockReset();
    handle_fixture_lineup_create_step_change_attempt_mock.mockReset();
    handle_fixture_lineup_create_team_change_mock.mockReset();
    initialize_fixture_lineup_create_page_mock.mockReset();
    reset_fixture_lineup_create_team_state_mock.mockReset();
    select_all_fixture_lineup_create_players_mock.mockReset();
    submit_fixture_lineup_create_form_mock.mockReset();
    toggle_fixture_lineup_create_player_mock.mockReset();
  });

  it("applies loaded reference state during page initialization", async () => {
    const { command, state } = create_command();
    initialize_fixture_lineup_create_page_mock.mockResolvedValue({
      kind: "loaded",
      reference_data: { fixtures: [] },
      current_step_index: 1,
    });
    build_fixture_lineup_create_reference_state_mock.mockReturnValue({
      fixtures: [{ id: "fixture-1" }],
      all_teams: [{ id: "team-1" }],
      all_competitions: [{ id: "competition-1" }],
      organizations: [{ id: "organization-1" }],
      selected_organization_state: {
        status: "present",
        organization: { id: "organization-1" },
      },
      error_message: "",
    });

    await create_fixture_lineup_create_page_controller_runtime(
      command as never,
    ).initialize_page();

    expect(command.set_fixtures).toHaveBeenCalledWith([{ id: "fixture-1" }]);
    expect(command.set_selected_organization_state).toHaveBeenCalledWith({
      status: "present",
      organization: {
        id: "organization-1",
      },
    });
    expect(state.loading).toBe(false);
    expect(state.current_step_index).toBe(1);
  });

  it("applies fixture state, auto-loads the preselected team, and advances to the player step", async () => {
    const { command, state } = create_command();
    handle_fixture_lineup_create_fixture_change_mock.mockResolvedValue({
      auto_selected_team_id: "team-1",
      current_step_index: 2,
    });
    build_fixture_lineup_create_fixture_change_state_mock.mockReturnValue({
      error_message: "",
      form_data: {
        organization_id: "organization-1",
        fixture_id: "fixture-1",
        team_id: "",
        selected_players: [],
      },
      selected_fixture_state: {
        status: "present",
        fixture: { id: "fixture-1" },
      },
      selected_organization_state: {
        status: "present",
        organization: { id: "organization-1" },
      },
      min_players: 7,
      max_players: 18,
      starters_count: 11,
      available_teams: [{ id: "team-1" }],
      fixture_team_label_by_team_id: new Map(),
      teams_with_existing_lineups: new Map(),
      selected_team_state: { status: "missing" },
      team_players: [],
      fixtures_with_complete_lineups: new Set(),
    });
    handle_fixture_lineup_create_team_change_mock.mockResolvedValue({});
    build_fixture_lineup_create_team_change_state_mock.mockReturnValue({
      selected_team_state: {
        status: "present",
        team: { id: "team-1" },
      },
      team_players: [{ id: "player-1" }],
      form_data: {
        organization_id: "organization-1",
        fixture_id: "fixture-1",
        team_id: "team-1",
        selected_players: [{ id: "player-1" }],
      },
      validation_errors: {},
    });

    await create_fixture_lineup_create_page_controller_runtime(
      command as never,
    ).handle_fixture_change("fixture-1");

    expect(command.set_error_message).toHaveBeenCalledWith("");
    expect(command.set_validation_errors).toHaveBeenCalledWith({});
    expect(command.set_confirm_lock_understood).toHaveBeenCalledWith(false);
    expect(command.set_player_search_text).toHaveBeenCalledWith("");
    expect(state.selected_fixture_state).toEqual({
      status: "present",
      fixture: { id: "fixture-1" },
    });
    expect(state.selected_team_state).toEqual({
      status: "present",
      team: { id: "team-1" },
    });
    expect(state.form_data.team_id).toBe("team-1");
    expect(state.current_step_index).toBe(3);
  });

  it("maps submit validation failures back onto the matching wizard step field", async () => {
    const { command, state } = create_command();
    submit_fixture_lineup_create_form_mock.mockResolvedValue({
      success: false,
      error_message: "Not enough players",
      step_index: 3,
    });
    get_fixture_lineup_create_validation_field_mock.mockReturnValue("players");

    await create_fixture_lineup_create_page_controller_runtime(
      command as never,
    ).handle_submit_locked_lineup();

    expect(state.saving).toBe(false);
    expect(state.current_step_index).toBe(3);
    expect(state.validation_errors).toEqual({ players: "Not enough players" });
  });

  it("navigates to the created lineup after a successful submit", async () => {
    const { command } = create_command();
    submit_fixture_lineup_create_form_mock.mockResolvedValue({
      success: true,
      lineup_id: "lineup-1",
    });

    await create_fixture_lineup_create_page_controller_runtime(
      command as never,
    ).handle_submit_locked_lineup();

    expect(command.goto).toHaveBeenCalledWith("/fixture-lineups/lineup-1");
  });
});
