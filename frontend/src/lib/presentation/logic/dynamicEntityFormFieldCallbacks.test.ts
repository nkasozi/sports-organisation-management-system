import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_syncable_image_file_size_error,
  MAX_SYNCABLE_IMAGE_FILE_BYTES,
} from "$lib/core/services/syncableImageFileValidation";

import { create_dynamic_form_field_callbacks } from "./dynamicEntityFormFieldCallbacks";
import { create_dependencies } from "./dynamicEntityFormFieldCallbacks.test_support";
import { DYNAMIC_FORM_MESSAGE } from "./dynamicFormMessages";

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
    convert_file_to_base64_mock.mockResolvedValueOnce({
      success: true,
      data: "base64-image",
    });

    await callbacks.handle_file_change(non_image_event as never, "logo_url");
    await callbacks.handle_file_change(image_event as never, "logo_url");

    expect(dependencies.set_form_state).toHaveBeenCalled();
    expect(convert_file_to_base64_mock).toHaveBeenCalled();
  });

  it("rejects oversized image uploads before processing them", async () => {
    const { dependencies, state } = create_dependencies();
    const callbacks = create_dynamic_form_field_callbacks(
      dependencies as never,
    );

    await callbacks.handle_file_change(
      {
        target: {
          files: [
            {
              size: MAX_SYNCABLE_IMAGE_FILE_BYTES + 1,
              type: "image/png",
            },
          ],
        },
      } as never,
      "logo_url",
    );

    expect(convert_file_to_base64_mock).not.toHaveBeenCalled();
    expect(
      (state.form_state.validation_errors as Record<string, string>)[
        "logo_url"
      ],
    ).toBe(build_syncable_image_file_size_error(MAX_SYNCABLE_IMAGE_FILE_BYTES));
  });

  it("shows a friendly error when an image cannot be processed", async () => {
    const { dependencies, state } = create_dependencies();
    const callbacks = create_dynamic_form_field_callbacks(
      dependencies as never,
    );
    convert_file_to_base64_mock.mockResolvedValueOnce({
      success: false,
      error: DYNAMIC_FORM_MESSAGE.FILE_PROCESSING_FAILED,
    });

    await callbacks.handle_file_change(
      { target: { files: [{ size: 10, type: "image/png" }] } } as never,
      "logo_url",
    );

    expect(
      (state.form_state.validation_errors as Record<string, string>)[
        "logo_url"
      ],
    ).toBe(DYNAMIC_FORM_MESSAGE.FILE_PROCESSING_FAILED);
  });
});
