import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_competition_edit_workspace_controller_runtime } from "./competitionEditWorkspaceControllerRuntime";

const { add_mock, remove_mock, submit_mock, toggle_mock } = vi.hoisted(() => ({
  add_mock: vi.fn(),
  remove_mock: vi.fn(),
  submit_mock: vi.fn(),
  toggle_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionEditPageData", () => ({
  load_competition_edit_sport: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionEditPageState", () => ({
  reset_competition_scoring_overrides: vi.fn(),
  toggle_competition_tie_breaker: toggle_mock,
  update_competition_points_override: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionEditWorkspaceActions", () => ({
  add_team_to_competition_workspace: add_mock,
  remove_team_from_competition_workspace: remove_mock,
  submit_competition_edit_workspace: submit_mock,
}));

vi.mock(
  "$lib/presentation/logic/competitionEditWorkspaceControllerDependencies",
  () => ({
    competition_edit_workspace_dependencies: {
      competition_team_use_cases: {},
      competition_use_cases: {},
    },
  }),
);

function create_command(can_edit_competition: boolean): {
  [key: string]: unknown;
  set_form_data: ReturnType<typeof vi.fn>;
  set_is_saving: ReturnType<typeof vi.fn>;
} {
  return {
    get_can_edit_competition: () => can_edit_competition,
    get_competition_formats: () => [],
    get_competition_id: () => "competition-1",
    get_competition_team_entries: () => [],
    get_available_teams: () => [],
    get_form_data: () => ({ lineup_submission_deadline_hours: 12 }),
    get_selected_format_state: () => ({ status: "missing" }),
    get_teams_in_competition: () => [],
    goto: vi.fn(),
    get_organizations: () => [],
    set_available_teams: vi.fn(),
    set_competition_team_entries: vi.fn(),
    set_form_data: vi.fn(),
    set_is_customizing_scoring: vi.fn(),
    set_is_saving: vi.fn(),
    set_selected_format_state: vi.fn(),
    set_selected_sport_state: vi.fn(),
    set_teams_in_competition: vi.fn(),
    show_toast: vi.fn(),
  };
}

describe("competitionEditWorkspaceControllerRuntime guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores team and submit actions when editing is not allowed", async () => {
    const command = create_command(false);
    const runtime = create_competition_edit_workspace_controller_runtime(
      command as never,
    );
    await runtime.handle_add_team_to_competition({ id: "t" } as never);
    await runtime.handle_remove_team_from_competition({ id: "t" } as never);
    await runtime.handle_submit();
    expect(add_mock).not.toHaveBeenCalled();
    expect(remove_mock).not.toHaveBeenCalled();
    expect(submit_mock).not.toHaveBeenCalled();
    expect(command.set_is_saving).not.toHaveBeenCalled();
  });

  it("toggles auto squad submission and clears the deadline when disabled", () => {
    const command = create_command(true);
    const runtime = create_competition_edit_workspace_controller_runtime(
      command as never,
    );
    runtime.handle_toggle_auto_squad_submission(true);
    expect(command.set_form_data).toHaveBeenLastCalledWith({
      allow_auto_squad_submission: true,
      lineup_submission_deadline_hours: 12,
    });
    runtime.handle_toggle_auto_squad_submission(false);
    expect(command.set_form_data).toHaveBeenLastCalledWith({
      allow_auto_squad_submission: false,
      lineup_submission_deadline_hours: 0,
    });
  });

  it("uses default tie breakers when no format is selected", () => {
    const command = create_command(true);
    toggle_mock.mockReturnValue({ toggled: true });
    create_competition_edit_workspace_controller_runtime(
      command as never,
    ).handle_toggle_tie_breaker("head_to_head" as never, true);
    expect(toggle_mock).toHaveBeenCalledWith(
      { lineup_submission_deadline_hours: 12 },
      "head_to_head",
      true,
      ["goal_difference", "goals_scored"],
    );
    expect(command.set_form_data).toHaveBeenCalledWith({ toggled: true });
  });
});
