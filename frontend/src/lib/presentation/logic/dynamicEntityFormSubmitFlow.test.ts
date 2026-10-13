import { beforeEach, describe, expect, it, vi } from "vitest";

import { DYNAMIC_ENTITY_FORM_SUBMIT_STATUS } from "./dynamicEntityFormConstants";
import {
  type DynamicEntityFormSubmitCommand,
  submit_dynamic_entity_form,
} from "./dynamicEntityFormSubmitFlow";

const {
  resolve_dynamic_form_create_result_mock,
  resolve_dynamic_form_update_result_mock,
  validate_form_data_against_metadata_mock,
} = vi.hoisted(() => ({
  resolve_dynamic_form_create_result_mock: vi.fn(),
  resolve_dynamic_form_update_result_mock: vi.fn(),
  validate_form_data_against_metadata_mock: vi.fn(),
}));

vi.mock("./dynamicEntityFormSubmission", () => ({
  resolve_dynamic_form_create_result: resolve_dynamic_form_create_result_mock,
  resolve_dynamic_form_update_result: resolve_dynamic_form_update_result_mock,
}));

vi.mock("./dynamicFormLogic", () => ({
  validate_form_data_against_metadata: validate_form_data_against_metadata_mock,
}));

function create_submit_command(
  overrides: Partial<DynamicEntityFormSubmitCommand> = {},
): DynamicEntityFormSubmitCommand {
  return {
    entity_type: "team",
    form_data: {},
    is_edit_mode: false,
    permission_denied: false,
    player_team_transfer_use_cases: {} as never,
    ...overrides,
  };
}

describe("dynamicEntityFormSubmitFlow", () => {
  beforeEach(() => {
    resolve_dynamic_form_create_result_mock.mockReset();
    resolve_dynamic_form_update_result_mock.mockReset();
    validate_form_data_against_metadata_mock.mockReset();
  });

  it("returns an empty result when metadata is missing or the action is permission denied", async () => {
    await expect(
      submit_dynamic_entity_form(create_submit_command()),
    ).resolves.toEqual({ status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SKIPPED });

    await expect(
      submit_dynamic_entity_form(
        create_submit_command({
          entity_metadata: { fields: [] } as never,
          permission_denied: true,
        }),
      ),
    ).resolves.toEqual({ status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SKIPPED });
  });

  it("returns validation errors without attempting to save when metadata validation fails", async () => {
    validate_form_data_against_metadata_mock.mockReturnValueOnce({
      success: false,
      error: { name: "Required" },
    });

    await expect(
      submit_dynamic_entity_form(
        create_submit_command({
          entity_metadata: { fields: [] } as never,
          form_data: { name: "" },
        }),
      ),
    ).resolves.toEqual({
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.INVALID,
      validation_errors: { name: "Required" },
    });
  });

  it("surfaces save errors from create or update operations", async () => {
    validate_form_data_against_metadata_mock.mockReturnValue({ success: true });
    resolve_dynamic_form_create_result_mock.mockResolvedValueOnce({
      success: false,
      error: "create failed",
    });
    resolve_dynamic_form_update_result_mock.mockResolvedValueOnce({
      success: false,
      error: "update failed",
    });

    await expect(
      submit_dynamic_entity_form(
        create_submit_command({
          entity_metadata: { fields: [] } as never,
          form_data: { name: "Lions" },
        }),
      ),
    ).resolves.toEqual({
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED,
      save_error_message: "create failed",
    });
    await expect(
      submit_dynamic_entity_form(
        create_submit_command({
          entity_metadata: { fields: [] } as never,
          form_data: { name: "Lions" },
          is_edit_mode: true,
          entity_data: { id: "team-1" } as never,
        }),
      ),
    ).resolves.toEqual({
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED,
      save_error_message: "update failed",
    });
  });
});
