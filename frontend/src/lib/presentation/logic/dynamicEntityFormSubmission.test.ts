import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  check_if_player_transfer_is_being_approved,
  execute_dynamic_form_transfer_membership_change,
  is_transfer_entity_and_status_just_changed_to_declined,
  resolve_dynamic_form_create_result,
  resolve_dynamic_form_update_result,
} from "./dynamicEntityFormSubmission";

const {
  apply_player_transfer_membership_change_mock,
  get_use_cases_for_entity_type_mock,
} = vi.hoisted(() => ({
  apply_player_transfer_membership_change_mock: vi.fn(),
  get_use_cases_for_entity_type_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/playerTransferApprovalLogic", () => ({
  apply_player_transfer_membership_change:
    apply_player_transfer_membership_change_mock,
}));

vi.mock("../../infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

describe("dynamicEntityFormSubmission", () => {
  beforeEach(() => {
    apply_player_transfer_membership_change_mock.mockReset();
    get_use_cases_for_entity_type_mock.mockReset();
  });

  it("prefers injected CRUD handlers for create and update operations", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { id: "entity-1" } });
    const update = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { id: "entity-1" } });

    await expect(
      resolve_dynamic_form_create_result("team", { create } as never, {
        name: "Lions",
      }),
    ).resolves.toEqual({ success: true, data: { id: "entity-1" } });
    await expect(
      resolve_dynamic_form_update_result(
        "team",
        { update } as never,
        "entity-1",
        { name: "Lions" },
      ),
    ).resolves.toEqual({ success: true, data: { id: "entity-1" } });
  });

  it("falls back to entity use cases and reports unsupported create or update operations", async () => {
    get_use_cases_for_entity_type_mock
      .mockReturnValueOnce({ success: false })
      .mockReturnValueOnce({ success: true, data: {} })
      .mockReturnValueOnce({
        success: true,
        data: {
          create: vi
            .fn()
            .mockResolvedValue({ success: true, data: { id: "entity-2" } }),
        },
      })
      .mockReturnValueOnce({ success: true, data: {} });

    await expect(
      resolve_dynamic_form_create_result(
        "team",
        {},
        {
          name: "Lions",
        },
      ),
    ).resolves.toEqual({
      success: false,
      error: 'No handler found for "team"',
    });
    await expect(
      resolve_dynamic_form_create_result(
        "team",
        {},
        {
          name: "Lions",
        },
      ),
    ).resolves.toEqual({
      success: false,
      error: 'Create is not supported for "team"',
    });
    await expect(
      resolve_dynamic_form_create_result(
        "team",
        {},
        {
          name: "Lions",
        },
      ),
    ).resolves.toEqual({
      success: true,
      data: { id: "entity-2" },
    });
    await expect(
      resolve_dynamic_form_update_result("team", {}, "entity-2", {
        name: "Lions",
      }),
    ).resolves.toEqual({
      success: false,
      error: 'Update is not supported for "team"',
    });
  });

  it("detects transfer approvals and declined transitions from form status changes", () => {
    expect(
      check_if_player_transfer_is_being_approved(
        "PlayerTeamTransferHistory",
        true,
        { status: "pending" } as never,
        { status: "approved" },
      ),
    ).toBe(true);
    expect(
      is_transfer_entity_and_status_just_changed_to_declined(
        "PlayerTeamTransferHistory",
        true,
        { status: "pending" } as never,
        { status: "declined" },
      ),
    ).toBe(true);
  });

  it("applies the transfer membership change and returns the transfer error when it fails", async () => {
    apply_player_transfer_membership_change_mock
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: "membership failed" });

    await expect(
      execute_dynamic_form_transfer_membership_change(
        { id: "transfer-1" } as never,
        {} as never,
      ),
    ).resolves.toEqual({ success: true, data: true });
    await expect(
      execute_dynamic_form_transfer_membership_change(
        { id: "transfer-2" } as never,
        {} as never,
      ),
    ).resolves.toEqual({ success: false, error: "membership failed" });
  });
});
