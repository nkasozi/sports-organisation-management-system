import { afterEach, describe, expect, it, vi } from "vitest";

import { create_fixture_lineup_create_runtime_harness as create_runtime } from "./fixtureLineupCreatePageControllerRuntimeHarness.test_support";

const { initialize_page_mock, submit_form_mock } = vi.hoisted(() => ({
  initialize_page_mock: vi.fn(),
  submit_form_mock: vi.fn(),
}));

vi.mock("./fixtureLineupCreateData", () => ({
  submit_fixture_lineup_create_form: submit_form_mock,
}));

vi.mock("./fixtureLineupCreatePageControllerInitialization", () => ({
  initialize_fixture_lineup_create_page: initialize_page_mock,
}));

describe("fixtureLineupCreatePageControllerRuntime selection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resets downstream selections when the organization changes", () => {
    const { runtime, state } = create_runtime({
      available_teams: [{ id: "team-1" }],
    });
    runtime.handle_organization_change("organization-1");
    expect(state.form_data).toEqual({
      organization_id: "organization-1",
      fixture_id: "",
      team_id: "",
      selected_players: [],
    });
    expect(state.selected_organization_state).toEqual({
      status: "present",
      organization: { id: "organization-1", name: "League" },
    });
    expect(state).toMatchObject({
      available_teams: [],
      team_players: [],
      current_step_index: 0,
      error_message: "",
      validation_errors: {},
    });
  });

  it("clears the team and interaction state when the team selection is cleared", async () => {
    const { runtime, state } = create_runtime();
    await runtime.handle_team_change("");
    expect(state).toMatchObject({
      confirm_lock_understood: false,
      player_search_text: "",
      error_message: "",
      validation_errors: {},
      current_step_index: 2,
      selected_team_state: { status: "missing" },
    });
  });

  it("blocks step changes until an organization is selected", () => {
    const { runtime, state } = create_runtime();
    expect(runtime.handle_step_change_attempt(0, 1)).toBe(false);
    expect(state.validation_errors).toEqual({
      organization_id: "Please select an organization first.",
    });
    expect(runtime.handle_step_change_attempt(2, 1)).toBe(true);
  });

  it("shows and then clears the maximum player warning", () => {
    vi.useFakeTimers();
    const players = [{ id: "p1" }, { id: "p2" }];
    const { runtime, state } = create_runtime({
      form_data: { selected_players: players },
      max_players: 2,
    });
    runtime.toggle_player_selection("p3");
    expect(state.error_message).toBe("Maximum 2 players can be selected");
    vi.advanceTimersByTime(3000);
    expect(state.error_message).toBe("");
    runtime.deselect_all_players();
    expect(state.form_data).toEqual({ selected_players: [] });
  });
});
