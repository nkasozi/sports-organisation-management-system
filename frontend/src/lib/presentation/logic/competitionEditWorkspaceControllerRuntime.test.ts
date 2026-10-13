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

  it("updates the format and organization selections", async () => {
    const { command } = create_competition_edit_command();
    load_competition_edit_sport_mock.mockResolvedValueOnce({
      success: true,
      data: {
        id: "sport-1",
        name: "Football",
      },
    });
    const runtime = create_competition_edit_workspace_controller_runtime(
      command as never,
    );

    runtime.handle_format_change({ detail: { value: "format-2" } } as never);
    await runtime.handle_organization_change({
      detail: { value: "organization-1" },
    } as never);

    expect(command.set_selected_format_state).toHaveBeenCalledWith({
      status: "present",
      competition_format: {
        id: "format-2",
        tie_breakers: ["head_to_head"],
      },
    });
    expect(command.set_selected_sport_state).toHaveBeenCalledWith({
      status: "present",
      sport: {
        id: "sport-1",
        name: "Football",
      },
    });
  });

  it("adds and removes teams while surfacing action failures through toasts", async () => {
    const { command } = create_competition_edit_command();
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

  it("removes a team using the competition team entries recorded by an earlier add", async () => {
    const { command } = create_competition_edit_command();
    const runtime = create_competition_edit_workspace_controller_runtime(
      command as never,
    );
    const team = { id: "team-2", name: "Falcons" };
    const entries_after_add = [
      { id: "entry-1", team_id: "team-1" },
      { id: "entry-2", team_id: "team-2" },
    ];
    add_team_to_competition_workspace_mock.mockResolvedValueOnce({
      success: true,
      data: {
        available_teams: [],
        competition_team_entries: entries_after_add,
        teams_in_competition: [team],
      },
    });
    remove_team_from_competition_workspace_mock.mockResolvedValueOnce({
      success: false,
      error: "locked",
    });

    await runtime.handle_add_team_to_competition(team as never);
    await runtime.handle_remove_team_from_competition(team as never);

    expect(
      remove_team_from_competition_workspace_mock.mock.calls[0][0].collections
        .competition_team_entries,
    ).toEqual(entries_after_add);
  });
});
