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

describe("dynamicEntityFormSubmitFlow transfer resolution", () => {
  beforeEach(() => {
    resolve_dynamic_form_create_result_mock.mockReset();
    resolve_dynamic_form_update_result_mock.mockReset();
    validate_form_data_against_metadata_mock.mockReset();
  });

  it("approves transfers through the confirm use case after saving them as pending", async () => {
    validate_form_data_against_metadata_mock.mockReturnValue({ success: true });
    resolve_dynamic_form_update_result_mock.mockResolvedValueOnce({
      success: true,
      data: { id: "transfer-1", status: "pending" },
    });
    const confirm_transfer = vi.fn().mockResolvedValue({
      success: true,
      data: { id: "transfer-1", status: "approved" },
    });

    await expect(
      submit_dynamic_entity_form(
        create_submit_command({
          entity_type: "PlayerTeamTransferHistory",
          entity_metadata: { fields: [] } as never,
          form_data: { status: "approved", notes: "agreed" },
          is_edit_mode: true,
          entity_data: { id: "transfer-1", status: "pending" } as never,
          player_team_transfer_use_cases: {
            confirm_transfer,
            reject_transfer: vi.fn(),
          },
        }),
      ),
    ).resolves.toEqual({
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SAVED,
      saved_entity: { id: "transfer-1", status: "approved" },
      transfer_declined: false,
    });
    expect(resolve_dynamic_form_update_result_mock).toHaveBeenCalledWith(
      "PlayerTeamTransferHistory",
      undefined,
      "transfer-1",
      { status: "pending", notes: "agreed" },
    );
    expect(confirm_transfer).toHaveBeenCalledWith("transfer-1");
  });

  it("declines transfers through the reject use case and reports the decline", async () => {
    validate_form_data_against_metadata_mock.mockReturnValue({ success: true });
    resolve_dynamic_form_update_result_mock.mockResolvedValueOnce({
      success: true,
      data: { id: "transfer-1", status: "pending" },
    });
    const reject_transfer = vi.fn().mockResolvedValue({
      success: true,
      data: { id: "transfer-1", status: "declined" },
    });

    const result = await submit_dynamic_entity_form(
      create_submit_command({
        entity_type: "PlayerTeamTransferHistory",
        entity_metadata: { fields: [] } as never,
        form_data: { status: "declined" },
        is_edit_mode: true,
        entity_data: { id: "transfer-1", status: "pending" } as never,
        player_team_transfer_use_cases: {
          confirm_transfer: vi.fn(),
          reject_transfer,
        },
      }),
    );

    expect(result).toMatchObject({ transfer_declined: true });
    expect(reject_transfer).toHaveBeenCalledWith("transfer-1");
  });

  it("refuses to re-open a declined transfer without saving anything", async () => {
    validate_form_data_against_metadata_mock.mockReturnValue({ success: true });
    const confirm_transfer = vi.fn();

    const result = await submit_dynamic_entity_form(
      create_submit_command({
        entity_type: "PlayerTeamTransferHistory",
        entity_metadata: { fields: [] } as never,
        form_data: { status: "approved" },
        is_edit_mode: true,
        entity_data: { id: "transfer-1", status: "declined" } as never,
        player_team_transfer_use_cases: {
          confirm_transfer,
          reject_transfer: vi.fn(),
        },
      }),
    );

    expect(result.status).toBe(DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED);
    expect(resolve_dynamic_form_update_result_mock).not.toHaveBeenCalled();
    expect(confirm_transfer).not.toHaveBeenCalled();
  });

  it("surfaces the friendly message when the approval cannot be completed", async () => {
    validate_form_data_against_metadata_mock.mockReturnValue({ success: true });
    resolve_dynamic_form_update_result_mock.mockResolvedValueOnce({
      success: true,
      data: { id: "transfer-1", status: "pending" },
    });

    await expect(
      submit_dynamic_entity_form(
        create_submit_command({
          entity_type: "PlayerTeamTransferHistory",
          entity_metadata: { fields: [] } as never,
          form_data: { status: "approved" },
          is_edit_mode: true,
          entity_data: { id: "transfer-1", status: "pending" } as never,
          player_team_transfer_use_cases: {
            confirm_transfer: vi
              .fn()
              .mockResolvedValue({ success: false, error: "Player mismatch" }),
            reject_transfer: vi.fn(),
          },
        }),
      ),
    ).resolves.toEqual({
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED,
      save_error_message: "Player mismatch",
    });
  });
});
