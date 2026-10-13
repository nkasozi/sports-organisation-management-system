import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DYNAMIC_ENTITY_FORM_SUBMIT_STATUS } from "./dynamicEntityFormConstants";
import {
  DYNAMIC_ENTITY_FORM_EVENT,
  DYNAMIC_ENTITY_FORM_MESSAGE,
} from "./dynamicEntityFormMessages";
import { submit_dynamic_entity_form } from "./dynamicEntityFormSubmitFlow";

const {
  resolve_dynamic_form_create_result_mock,
  validate_form_data_against_metadata_mock,
} = vi.hoisted(() => ({
  resolve_dynamic_form_create_result_mock: vi.fn(),
  validate_form_data_against_metadata_mock: vi.fn(),
}));

vi.mock("./dynamicEntityFormSubmission", () => ({
  check_if_player_transfer_is_being_approved: vi.fn(() => false),
  execute_dynamic_form_transfer_membership_change: vi.fn(),
  is_transfer_entity_and_status_just_changed_to_declined: vi.fn(() => false),
  resolve_dynamic_form_create_result: resolve_dynamic_form_create_result_mock,
  resolve_dynamic_form_update_result: vi.fn(),
}));

vi.mock("./dynamicFormLogic", () => ({
  validate_form_data_against_metadata: validate_form_data_against_metadata_mock,
}));

describe("submitting a form when saving throws unexpectedly", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    validate_form_data_against_metadata_mock.mockReturnValue({
      success: true,
      data: true,
    });
    resolve_dynamic_form_create_result_mock.mockRejectedValue(
      new TypeError("Cannot read properties of undefined (reading 'trim')"),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a friendly failure instead of leaving the form stuck saving", async () => {
    const result = await submit_dynamic_entity_form({
      entity_type: "team",
      entity_metadata: { fields: [] } as never,
      form_data: {},
      is_edit_mode: false,
      permission_denied: false,
      player_team_membership_use_cases: {} as never,
    });

    expect(result).toEqual({
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED,
      save_error_message: DYNAMIC_ENTITY_FORM_MESSAGE.SAVE_FAILED,
    });
  });

  it("logs the technical detail with a structured event", async () => {
    await submit_dynamic_entity_form({
      entity_type: "team",
      entity_metadata: { fields: [] } as never,
      form_data: {},
      is_edit_mode: false,
      permission_denied: false,
      player_team_membership_use_cases: {} as never,
    });

    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: DYNAMIC_ENTITY_FORM_EVENT.SAVE_CRASHED,
        entity_type: "team",
      }),
    );
  });
});
