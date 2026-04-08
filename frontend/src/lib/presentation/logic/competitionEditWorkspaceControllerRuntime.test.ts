import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  add_team_to_competition_workspace_mock,
  load_competition_edit_sport_mock,
  remove_team_from_competition_workspace_mock,
  reset_competition_scoring_overrides_mock,
  submit_competition_edit_workspace_mock,
  toggle_competition_tie_breaker_mock,
  update_competition_points_override_mock,
} = vi.hoisted(() => ({
  add_team_to_competition_workspace_mock: vi.fn(),
  load_competition_edit_sport_mock: vi.fn(),
  remove_team_from_competition_workspace_mock: vi.fn(),
  reset_competition_scoring_overrides_mock: vi.fn(),
  submit_competition_edit_workspace_mock: vi.fn(),
  toggle_competition_tie_breaker_mock: vi.fn(),
  update_competition_points_override_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionEditPageData", () => ({
  load_competition_edit_sport: load_competition_edit_sport_mock,
}));

vi.mock("$lib/presentation/logic/competitionEditPageState", () => ({
  reset_competition_scoring_overrides: reset_competition_scoring_overrides_mock,
  toggle_competition_tie_breaker: toggle_competition_tie_breaker_mock,
  update_competition_points_override: update_competition_points_override_mock,
}));

vi.mock("$lib/presentation/logic/competitionEditWorkspaceActions", () => ({
  add_team_to_competition_workspace: add_team_to_competition_workspace_mock,
  remove_team_from_competition_workspace:
    remove_team_from_competition_workspace_mock,
  submit_competition_edit_workspace: submit_competition_edit_workspace_mock,
}));

vi.mock(
  "$lib/presentation/logic/competitionEditWorkspaceControllerDependencies",
  () => ({
    competition_edit_workspace_dependencies: {
      competition_team_use_cases: { marker: "teams" },
      competition_use_cases: { marker: "competition" },
    },
  }),
);

import { create_competition_edit_workspace_controller_runtime } from "./competitionEditWorkspaceControllerRuntime";

describe("competitionEditWorkspaceControllerRuntime", () => {
  function create_command() {
    const state = {
      available_teams: [{ id: "team-2", name: "Falcons" }],
      form_data: {
        competition_format_id: "format-1",
        organization_id: "organization-1",
        allow_auto_squad_submission: true,
        lineup_submission_deadline_hours: 24,
      },
      selected_format: {
        id: "format-1",
        tie_breakers: ["goal_difference", "goals_scored"],
      },
      teams_in_competition: [{ id: "team-1", name: "Lions" }],
    };

    const command = {
      can_edit_competition: true,
      competition_formats: [
        { id: "format-1", tie_breakers: ["goal_difference", "goals_scored"] },
        { id: "format-2", tie_breakers: ["head_to_head"] },
      ],
      competition_id: "competition-1",
      competition_team_entries: [{ id: "entry-1", team_id: "team-1" }],
      get_available_teams: () => state.available_teams as never,
      get_form_data: () => state.form_data as never,
      get_selected_format: () => state.selected_format as never,
      get_teams_in_competition: () => state.teams_in_competition as never,
      goto: vi.fn(async () => undefined),
      organizations: [{ id: "organization-1", sport_id: "sport-1" }] as never,
      set_available_teams: vi.fn((value: unknown[]) => {
        state.available_teams = value as never;
      }),
      set_competition_team_entries: vi.fn(),
      set_form_data: vi.fn((value: unknown) => {
        state.form_data = value as never;
      }),
      set_is_customizing_scoring: vi.fn(),
      set_is_saving: vi.fn(),
      set_selected_format: vi.fn((value: unknown) => {
        state.selected_format = value as never;
      }),
      set_selected_sport: vi.fn(),
      set_teams_in_competition: vi.fn((value: unknown[]) => {
        state.teams_in_competition = value as never;
      }),
      show_toast: vi.fn(),
    };

    return { command, state };
  }

  beforeEach(() => {
    vi.useRealTimers();
    add_team_to_competition_workspace_mock.mockReset();
    load_competition_edit_sport_mock.mockReset();
    remove_team_from_competition_workspace_mock.mockReset();
    reset_competition_scoring_overrides_mock.mockReset();
    submit_competition_edit_workspace_mock.mockReset();
    toggle_competition_tie_breaker_mock.mockReset();
    update_competition_points_override_mock.mockReset();
  });

  it("updates the format and organization selections", async () => {
    const { command } = create_command();
    load_competition_edit_sport_mock.mockResolvedValueOnce({
      id: "sport-1",
      name: "Football",
    });
    const runtime = create_competition_edit_workspace_controller_runtime(
      command as never,
    );

    runtime.handle_format_change({ detail: { value: "format-2" } } as never);
    await runtime.handle_organization_change({
      detail: { value: "organization-1" },
    } as never);

    expect(command.set_selected_format).toHaveBeenCalledWith({
      id: "format-2",
      tie_breakers: ["head_to_head"],
    });
    expect(command.set_selected_sport).toHaveBeenCalledWith({
      id: "sport-1",
      name: "Football",
    });
  });

  it("adds and removes teams while surfacing action failures through toasts", async () => {
    const { command } = create_command();
    const runtime = create_competition_edit_workspace_controller_runtime(
      command as never,
    );
    const team = { id: "team-2", name: "Falcons" };
    add_team_to_competition_workspace_mock.mockResolvedValueOnce({
      success: true,
      data: {
        available_teams: [],
        competition_team_entries: [{ id: "entry-2", team_id: "team-2" }],
        teams_in_competition: [team],
      },
    });
    remove_team_from_competition_workspace_mock.mockResolvedValueOnce({
      success: false,
      error: "locked",
    });

    await runtime.handle_add_team_to_competition(team as never);
    await runtime.handle_remove_team_from_competition(team as never);

    expect(command.set_available_teams).toHaveBeenCalledWith([]);
    expect(command.set_competition_team_entries).toHaveBeenCalledWith([
      { id: "entry-2", team_id: "team-2" },
    ]);
    expect(command.set_teams_in_competition).toHaveBeenCalledWith([team]);
    expect(command.show_toast).toHaveBeenCalledWith(
      "Falcons added to competition",
      "success",
    );
    expect(command.show_toast).toHaveBeenCalledWith(
      "Failed to remove team: locked",
      "error",
    );
  });

  it("resets and updates scoring overrides from the selected format", () => {
    const reset_case = create_command();
    reset_competition_scoring_overrides_mock.mockReturnValueOnce({
      reset: true,
    });
    const reset_runtime = create_competition_edit_workspace_controller_runtime(
      reset_case.command as never,
    );

    reset_runtime.handle_reset_scoring();

    expect(reset_case.command.set_form_data).toHaveBeenCalledWith({
      reset: true,
    });
    expect(reset_case.command.set_is_customizing_scoring).toHaveBeenCalledWith(
      false,
    );

    const auto_submission_case = create_command();
    const auto_submission_runtime =
      create_competition_edit_workspace_controller_runtime(
        auto_submission_case.command as never,
      );

    auto_submission_runtime.handle_toggle_auto_squad_submission(false);

    expect(auto_submission_case.command.set_form_data).toHaveBeenCalledWith({
      ...auto_submission_case.state.form_data,
      allow_auto_squad_submission: false,
      lineup_submission_deadline_hours: 0,
    });

    const tie_breaker_case = create_command();
    toggle_competition_tie_breaker_mock.mockReturnValueOnce({
      tie_breakers: ["head_to_head"],
    });
    const tie_breaker_runtime =
      create_competition_edit_workspace_controller_runtime(
        tie_breaker_case.command as never,
      );

    tie_breaker_runtime.handle_toggle_tie_breaker(
      "head_to_head" as never,
      true,
    );

    expect(toggle_competition_tie_breaker_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        competition_format_id: "format-1",
        organization_id: "organization-1",
      }),
      "head_to_head",
      true,
      ["goal_difference", "goals_scored"],
    );

    const points_case = create_command();
    update_competition_points_override_mock.mockReturnValueOnce({
      points_for_win: 5,
    });
    const points_runtime = create_competition_edit_workspace_controller_runtime(
      points_case.command as never,
    );

    points_runtime.handle_update_points("points_for_win", "5");

    expect(update_competition_points_override_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        competition_format_id: "format-1",
        organization_id: "organization-1",
      }),
      "points_for_win",
      "5",
    );
  });

  it("submits successfully with a delayed redirect and shows the error toast when saving fails", async () => {
    const success_case = create_command();
    vi.useFakeTimers();
    submit_competition_edit_workspace_mock.mockResolvedValueOnce({
      success: true,
      data: true,
    });
    await create_competition_edit_workspace_controller_runtime(
      success_case.command as never,
    ).handle_submit();
    vi.advanceTimersByTime(1500);

    expect(success_case.command.show_toast).toHaveBeenCalledWith(
      "Competition updated successfully!",
      "success",
    );
    expect(success_case.command.goto).toHaveBeenCalledWith("/competitions");

    const failure_case = create_command();
    submit_competition_edit_workspace_mock.mockResolvedValueOnce({
      success: false,
      error: "save failed",
    });
    await create_competition_edit_workspace_controller_runtime(
      failure_case.command as never,
    ).handle_submit();
    expect(failure_case.command.show_toast).toHaveBeenCalledWith(
      "save failed",
      "error",
    );
  });
});
