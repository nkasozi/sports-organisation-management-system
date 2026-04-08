import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { create_dynamic_form_field_callbacks } from "./dynamicEntityFormFieldCallbacks";

describe("dynamicEntityFormFieldCallbacks", () => {
  function create_dependencies() {
    const state = {
      form_state: {
        form_data: { player_id: "player-1" },
        foreign_key_options: {},
        all_competition_teams_cache: [],
        validation_errors: {},
      },
      warning_state: {
        color_clash_warnings: [],
        official_team_conflict_warnings: [],
        gender_mismatch_warnings: [],
        fixture_team_gender_mismatch_warnings: [],
      },
    };

    const dependencies = {
      entity_type: "FixtureDetailsSetup",
      get_entity_metadata: () => ({ fields: [] }) as never,
      get_form_state: () => state.form_state as never,
      set_form_state: vi.fn((next_state: unknown) => {
        state.form_state = next_state as never;
      }),
      get_warning_state: () => state.warning_state as never,
      set_warning_state: vi.fn((next_state: unknown) => {
        state.warning_state = next_state as never;
      }),
      navigate_to_foreign_entity: vi.fn(() => true),
      conflict_dependencies: {} as never,
      gender_dependencies: {} as never,
    };

    return { dependencies, state };
  }

  beforeEach(() => {
    build_dynamic_form_jersey_color_warnings_mock.mockReset();
    convert_file_to_base64_mock.mockReset();
    handle_dynamic_form_dependency_change_mock.mockReset();
    load_dynamic_form_fixture_gender_warnings_mock.mockReset();
    load_dynamic_form_official_conflict_warnings_mock.mockReset();
    load_dynamic_form_player_gender_warnings_mock.mockReset();
    update_dynamic_form_field_value_mock.mockReset();
  });

  it("updates scalar and managed field values and preserves the foreign-entity navigator", () => {
    const { dependencies, state } = create_dependencies();
    update_dynamic_form_field_value_mock.mockReturnValueOnce({
      player_id: "player-2",
    });
    const callbacks = create_dynamic_form_field_callbacks(
      dependencies as never,
    );

    expect(callbacks.set_scalar_value("title", "Training")).toBe(true);
    expect(callbacks.set_managed_value("player_id", "player-2")).toBe(true);
    expect(state.form_state.form_data).toEqual({ player_id: "player-2" });
    expect(callbacks.navigate_to_foreign_entity("teams")).toBe(true);
  });

  it("validates uploaded files and stores processed base64 content for images", async () => {
    const { dependencies } = create_dependencies();
    const callbacks = create_dynamic_form_field_callbacks(
      dependencies as never,
    );
    const non_image_event = {
      target: { files: [{ type: "text/plain" }] },
    };
    const image_event = {
      target: { files: [{ type: "image/png" }] },
    };
    convert_file_to_base64_mock.mockResolvedValueOnce("base64-image");

    await callbacks.handle_file_change(non_image_event as never, "logo_url");
    await callbacks.handle_file_change(image_event as never, "logo_url");

    expect(dependencies.set_form_state).toHaveBeenCalled();
    expect(convert_file_to_base64_mock).toHaveBeenCalled();
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
