import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_competition_edit_workspace_controller_runtime } from "./competitionEditWorkspaceControllerRuntime";
import { create_competition_edit_command } from "./competitionEditWorkspaceControllerRuntime.test_support";

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

describe("competitionEditWorkspaceControllerRuntime", () => {
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

  it("resets and updates scoring overrides from the selected format", () => {
    const reset_case = create_competition_edit_command();
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

    const auto_submission_case = create_competition_edit_command();
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

    const tie_breaker_case = create_competition_edit_command();
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

    const points_case = create_competition_edit_command();
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
    const success_case = create_competition_edit_command();
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

    const failure_case = create_competition_edit_command();
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
