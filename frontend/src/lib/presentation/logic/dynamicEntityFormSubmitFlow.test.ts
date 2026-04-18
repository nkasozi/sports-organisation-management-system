import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type DynamicEntityFormSubmitCommand,
  submit_dynamic_entity_form,
} from "./dynamicEntityFormSubmitFlow";

const {
  check_if_player_transfer_is_being_approved_mock,
  execute_dynamic_form_transfer_membership_change_mock,
  is_transfer_entity_and_status_just_changed_to_declined_mock,
  resolve_dynamic_form_create_result_mock,
  resolve_dynamic_form_update_result_mock,
  validate_form_data_against_metadata_mock,
} = vi.hoisted(() => ({
  check_if_player_transfer_is_being_approved_mock: vi.fn(),
  execute_dynamic_form_transfer_membership_change_mock: vi.fn(),
  is_transfer_entity_and_status_just_changed_to_declined_mock: vi.fn(),
  resolve_dynamic_form_create_result_mock: vi.fn(),
  resolve_dynamic_form_update_result_mock: vi.fn(),
  validate_form_data_against_metadata_mock: vi.fn(),
}));

vi.mock("./dynamicEntityFormSubmission", () => ({
  check_if_player_transfer_is_being_approved:
    check_if_player_transfer_is_being_approved_mock,
  execute_dynamic_form_transfer_membership_change:
    execute_dynamic_form_transfer_membership_change_mock,
  is_transfer_entity_and_status_just_changed_to_declined:
    is_transfer_entity_and_status_just_changed_to_declined_mock,
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
    player_team_membership_use_cases: {} as never,
    ...overrides,
  };
}

describe("dynamicEntityFormSubmitFlow", () => {
  beforeEach(() => {
    check_if_player_transfer_is_being_approved_mock.mockReset();
    execute_dynamic_form_transfer_membership_change_mock.mockReset();
    is_transfer_entity_and_status_just_changed_to_declined_mock.mockReset();
    resolve_dynamic_form_create_result_mock.mockReset();
    resolve_dynamic_form_update_result_mock.mockReset();
    validate_form_data_against_metadata_mock.mockReset();
  });

  it("returns an empty result when metadata is missing or the action is permission denied", async () => {
    await expect(
      submit_dynamic_entity_form(create_submit_command()),
    ).resolves.toEqual({
      validation_errors: {},
      save_error_message: "",

      transfer_declined: false,
    });

    await expect(
      submit_dynamic_entity_form(
        create_submit_command({
          entity_metadata: { fields: [] } as never,
          permission_denied: true,
        }),
      ),
    ).resolves.toEqual({
      validation_errors: {},
      save_error_message: "",

      transfer_declined: false,
    });
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
      validation_errors: { name: "Required" },
      save_error_message: "",

      transfer_declined: false,
    });
  });

  it("surfaces save errors from create or update operations", async () => {
    validate_form_data_against_metadata_mock.mockReturnValue({ success: true });
    check_if_player_transfer_is_being_approved_mock.mockReturnValue(false);
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
      validation_errors: {},
      save_error_message: "create failed",

      transfer_declined: false,
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
      validation_errors: {},
      save_error_message: "update failed",

      transfer_declined: false,
    });
  });

  it("applies transfer membership changes after approval and reports declined transfer updates", async () => {
    validate_form_data_against_metadata_mock.mockReturnValue({ success: true });
    check_if_player_transfer_is_being_approved_mock.mockReturnValueOnce(true);
    resolve_dynamic_form_update_result_mock.mockResolvedValueOnce({
      success: true,
      data: { id: "transfer-1" },
    });
    execute_dynamic_form_transfer_membership_change_mock.mockResolvedValueOnce({
      success: true,
      data: true,
    });
    is_transfer_entity_and_status_just_changed_to_declined_mock.mockReturnValueOnce(
      true,
    );

    await expect(
      submit_dynamic_entity_form(
        create_submit_command({
          entity_type: "PlayerTeamTransferHistory",
          entity_metadata: { fields: [] } as never,
          form_data: { status: "approved" },
          is_edit_mode: true,
          entity_data: { id: "transfer-1", status: "pending" } as never,
        }),
      ),
    ).resolves.toEqual({
      validation_errors: {},
      save_error_message: "",
      saved_entity: { id: "transfer-1" },
      transfer_declined: true,
    });
  });
});
