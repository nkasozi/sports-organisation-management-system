import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_fixture_lineup_create_page_controller_runtime } from "./fixtureLineupCreatePageControllerRuntime";
import {
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
} from "./fixtureLineupCreatePageControllerRuntime.test_support";
import { create_command } from "./fixtureLineupCreatePageControllerRuntimeCommand.test_support";

vi.mock("./fixtureLineupCreateData", async () =>
  (
    await import("./fixtureLineupCreatePageControllerRuntime.test_support")
  ).create_fixture_lineup_create_data_module_mock(),
);

vi.mock("./fixtureLineupCreatePageControllerInitialization", async () =>
  (
    await import("./fixtureLineupCreatePageControllerRuntime.test_support")
  ).create_controller_initialization_module_mock(),
);

vi.mock("./fixtureLineupCreatePageControllerUpdates", async () =>
  (
    await import("./fixtureLineupCreatePageControllerRuntime.test_support")
  ).create_controller_updates_module_mock(),
);

vi.mock("./fixtureLineupCreatePageFlow", async () =>
  (
    await import("./fixtureLineupCreatePageControllerRuntime.test_support")
  ).create_page_flow_module_mock(),
);

describe("fixtureLineupCreatePageControllerRuntime", () => {
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
      failure_display: "field_validation",
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
