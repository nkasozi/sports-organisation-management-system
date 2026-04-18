import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_bulk_player_assignment_page_controller_runtime } from "./bulkPlayerAssignmentPageControllerRuntime";

const {
  check_entity_authorized_mock,
  ensure_auth_profile_mock,
  load_bulk_player_assignment_page_data_mock,
  save_bulk_player_assignments_mock,
} = vi.hoisted(() => ({
  check_entity_authorized_mock: vi.fn(),
  ensure_auth_profile_mock: vi.fn(),
  load_bulk_player_assignment_page_data_mock: vi.fn(),
  save_bulk_player_assignments_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({
    check_entity_authorized: check_entity_authorized_mock,
  }),
}));

vi.mock("./authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

vi.mock("./bulkPlayerAssignmentPageData", () => ({
  load_bulk_player_assignment_page_data:
    load_bulk_player_assignment_page_data_mock,
  save_bulk_player_assignments: save_bulk_player_assignments_mock,
}));

describe("bulkPlayerAssignmentPageControllerRuntime", () => {
  function create_command() {
    const state = {
      all_player_assignments: [
        { id: "assignment-1", selected: false },
        { id: "assignment-2", selected: false },
      ],
      error_message: "",
      is_loading: true,
      is_saving: false,
      selected_team: { id: "team-1", name: "Lions" },
      selected_team_id: "team-1",
      unassigned_players: [{ id: "assignment-1", selected: false }],
      assigned_players_on_other_teams: [
        { id: "assignment-2", selected: false },
      ],
    };

    const command = {
      access_denied_message: "Access denied",
      access_denied_path: "/bulk-player-assignment",
      dependencies: {} as never,
      failed_summary:
        "Assigned {success_count} players with {error_count} failures",
      get_assigned_players_on_other_teams: () =>
        state.assigned_players_on_other_teams as never,
      get_auth_state: () => ({
        current_profile_state: { status: "missing" },
        current_token_state: {
          status: "present",
          raw_token: "token-1",
        },
      }),
      get_selected_team_state: () => ({
        status: "present",
        team: state.selected_team as never,
      }),
      get_selected_team_id: () => state.selected_team_id,
      get_unassigned_players: () => state.unassigned_players as never,
      goto: vi.fn(async () => {}),
      is_browser: true,
      set_access_denial: vi.fn(),
      set_all_player_assignments: vi.fn(
        (value: typeof state.all_player_assignments) => {
          state.all_player_assignments = value;
        },
      ),
      set_error_message: vi.fn((value: string) => {
        state.error_message = value;
      }),
      set_gender_name_map: vi.fn(),
      set_is_loading: vi.fn((value: boolean) => {
        state.is_loading = value;
      }),
      set_is_saving: vi.fn((value: boolean) => {
        state.is_saving = value;
      }),
      set_teams: vi.fn(),
      show_toast: vi.fn(),
      success_summary: "Assigned {success_count} players to {team_name}",
    };

    return { command, state };
  }

  beforeEach(() => {
    vi.useRealTimers();
    check_entity_authorized_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    load_bulk_player_assignment_page_data_mock.mockReset();
    save_bulk_player_assignments_mock.mockReset();
  });

  it("stops initialization when auth fails or the user is denied permission", async () => {
    const auth_failed = create_command();
    ensure_auth_profile_mock.mockResolvedValueOnce({
      success: false,
      error_message: "Missing profile",
    });

    await create_bulk_player_assignment_page_controller_runtime(
      auth_failed.command as never,
    ).initialize_page();
    expect(auth_failed.state.error_message).toBe("Missing profile");
    expect(auth_failed.state.is_loading).toBe(false);

    const denied = create_command();
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    check_entity_authorized_mock.mockResolvedValueOnce({
      success: true,
      data: { is_authorized: false },
    });

    await create_bulk_player_assignment_page_controller_runtime(
      denied.command as never,
    ).initialize_page();
    expect(denied.command.set_access_denial).toHaveBeenCalledWith(
      "/bulk-player-assignment",
      "Access denied",
    );
    expect(denied.command.goto).toHaveBeenCalledWith("/");
  });

  it("loads teams, player assignments, and gender names on successful initialization", async () => {
    const { command, state } = create_command();
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    check_entity_authorized_mock.mockResolvedValue({
      success: true,
      data: { is_authorized: true },
    });
    load_bulk_player_assignment_page_data_mock.mockResolvedValue({
      teams: [{ id: "team-1", name: "Lions" }],
      all_player_assignments: [{ id: "assignment-1", selected: false }],
      gender_name_map: new Map([["gender-1", "Women"]]),
      error_message: "",
    });

    await create_bulk_player_assignment_page_controller_runtime(
      command as never,
    ).initialize_page();

    expect(command.set_teams).toHaveBeenCalledWith([
      { id: "team-1", name: "Lions" },
    ]);
    expect(command.set_gender_name_map).toHaveBeenCalledWith(
      new Map([["gender-1", "Women"]]),
    );
    expect(state.is_loading).toBe(false);
  });

  it("toggles, selects, and deselects player assignments in the combined list", () => {
    const { command, state } = create_command();
    const runtime = create_bulk_player_assignment_page_controller_runtime(
      command as never,
    );

    runtime.toggle_player_selection(state.unassigned_players[0] as never);
    expect(state.unassigned_players[0].selected).toBe(true);

    runtime.select_all_unassigned();
    expect(state.all_player_assignments[0]).toEqual({
      id: "assignment-1",
      selected: true,
    });

    runtime.deselect_all();
    expect(state.all_player_assignments).toEqual([
      { id: "assignment-1", selected: false },
      { id: "assignment-2", selected: false },
    ]);
  });

  it("shows success and failure save summaries based on the save result", async () => {
    const success_case = create_command();
    vi.useFakeTimers();
    save_bulk_player_assignments_mock.mockResolvedValueOnce({
      success_count: 2,
      error_count: 0,
    });

    await create_bulk_player_assignment_page_controller_runtime(
      success_case.command as never,
    ).handle_save();
    vi.advanceTimersByTime(1500);
    expect(success_case.command.show_toast).toHaveBeenCalledWith(
      "Assigned 2 players to Lions",
      "success",
    );
    expect(success_case.command.goto).toHaveBeenCalledWith(
      "/player-team-memberships",
    );

    const failure_case = create_command();
    save_bulk_player_assignments_mock.mockResolvedValueOnce({
      success_count: 1,
      error_count: 2,
    });
    await create_bulk_player_assignment_page_controller_runtime(
      failure_case.command as never,
    ).handle_save();
    expect(failure_case.command.show_toast).toHaveBeenCalledWith(
      "Assigned 1 players with 2 failures",
      "error",
    );
  });
});
