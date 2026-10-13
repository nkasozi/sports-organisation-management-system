import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_dynamic_form_field_callbacks } from "./dynamicEntityFormFieldCallbacks";
import { create_dependencies } from "./dynamicEntityFormFieldCallbacks.test_support";

const {
  build_dynamic_form_jersey_color_warnings_mock,
  convert_file_to_base64_mock,
  handle_dynamic_form_dependency_change_mock,
  load_dynamic_form_fixture_gender_warnings_mock,
  load_dynamic_form_official_conflict_warnings_mock,
  load_dynamic_form_player_gender_warnings_mock,
  update_dynamic_form_field_value_mock,
} = vi.hoisted(() => ({
  build_dynamic_form_jersey_color_warnings_mock: vi.fn(),
  convert_file_to_base64_mock: vi.fn(),
  handle_dynamic_form_dependency_change_mock: vi.fn(),
  load_dynamic_form_fixture_gender_warnings_mock: vi.fn(),
  load_dynamic_form_official_conflict_warnings_mock: vi.fn(),
  load_dynamic_form_player_gender_warnings_mock: vi.fn(),
  update_dynamic_form_field_value_mock: vi.fn(),
}));

vi.mock("./dynamicEntityFormConflictWarnings", () => ({
  build_dynamic_form_jersey_color_warnings:
    build_dynamic_form_jersey_color_warnings_mock,
}));

vi.mock("./dynamicEntityFormDependencyHandling", () => ({
  handle_dynamic_form_dependency_change:
    handle_dynamic_form_dependency_change_mock,
}));

vi.mock("./dynamicEntityFormFieldState", () => ({
  update_dynamic_form_field_value: update_dynamic_form_field_value_mock,
}));

vi.mock("./dynamicEntityFormGenderWarnings", () => ({
  load_dynamic_form_fixture_gender_warnings:
    load_dynamic_form_fixture_gender_warnings_mock,
  load_dynamic_form_player_gender_warnings:
    load_dynamic_form_player_gender_warnings_mock,
}));

vi.mock("./dynamicEntityFormOfficialConflictWarnings", () => ({
  load_dynamic_form_official_conflict_warnings:
    load_dynamic_form_official_conflict_warnings_mock,
}));

vi.mock("./dynamicFormLogic", () => ({
  convert_file_to_base64: convert_file_to_base64_mock,
}));

describe("dynamicEntityFormFieldCallbacks", () => {
  beforeEach(() => {
    build_dynamic_form_jersey_color_warnings_mock.mockReset();
    convert_file_to_base64_mock.mockReset();
    handle_dynamic_form_dependency_change_mock.mockReset();
    load_dynamic_form_fixture_gender_warnings_mock.mockReset();
    load_dynamic_form_official_conflict_warnings_mock.mockReset();
    load_dynamic_form_player_gender_warnings_mock.mockReset();
    update_dynamic_form_field_value_mock.mockReset();
  });

  it("updates dependent options and warning state after foreign-key changes", async () => {
    const { dependencies } = create_dependencies();
    update_dynamic_form_field_value_mock.mockReturnValueOnce({
      player_id: "player-2",
    });
    handle_dynamic_form_dependency_change_mock.mockResolvedValueOnce({
      form_data: { player_id: "player-2" },
      foreign_key_options: { team_id: [{ id: "team-1" }] },
      all_competition_teams_cache: [],
      should_check_jersey_color_clashes: true,
      should_run_gender_mismatch_check: true,
      should_run_fixture_team_gender_mismatch_check: true,
    });
    build_dynamic_form_jersey_color_warnings_mock.mockReturnValueOnce([
      "Jersey clash",
    ]);
    load_dynamic_form_official_conflict_warnings_mock.mockResolvedValueOnce([
      "Official conflict",
    ]);
    load_dynamic_form_player_gender_warnings_mock.mockResolvedValueOnce([
      "Gender mismatch",
    ]);
    load_dynamic_form_fixture_gender_warnings_mock.mockResolvedValueOnce([
      "Fixture mismatch",
    ]);
    const callbacks = create_dynamic_form_field_callbacks(
      dependencies as never,
    );

    await callbacks.handle_foreign_key_change("player_id", "player-2");

    expect(dependencies.set_form_state).toHaveBeenCalled();
    expect(dependencies.set_warning_state).toHaveBeenCalledWith({
      color_clash_warnings: ["Jersey clash"],
      official_team_conflict_warnings: ["Official conflict"],
      gender_mismatch_warnings: ["Gender mismatch"],
      fixture_team_gender_mismatch_warnings: ["Fixture mismatch"],
    });
  });

  it("reloads official conflict warnings when official assignments change", async () => {
    const { dependencies } = create_dependencies();
    update_dynamic_form_field_value_mock.mockReturnValueOnce({
      assigned_officials: [{ official_id: "official-1", role_id: "referee" }],
    });
    load_dynamic_form_official_conflict_warnings_mock.mockResolvedValueOnce([
      "Official conflict",
    ]);
    const callbacks = create_dynamic_form_field_callbacks(
      dependencies as never,
    );

    await callbacks.handle_official_assignments_change("assigned_officials", [
      { official_id: "official-1", role_id: "referee" },
    ]);

    expect(dependencies.set_warning_state).toHaveBeenCalledWith({
      color_clash_warnings: [],
      official_team_conflict_warnings: ["Official conflict"],
      gender_mismatch_warnings: [],
      fixture_team_gender_mismatch_warnings: [],
    });
  });
});
