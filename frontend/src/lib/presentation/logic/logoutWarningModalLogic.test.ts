import { describe, expect, it, vi } from "vitest";

import {
  get_logout_warning_modal_state,
  LOGOUT_WARNING_MODAL_STATE,
  type LogoutWarningSyncPort,
  sync_logout_warning_modal_changes,
} from "./logoutWarningModalLogic";

function create_sync_port(
  overrides: Partial<LogoutWarningSyncPort> = {},
): LogoutWarningSyncPort {
  return {
    get_unsynced_local_change_count: vi.fn(async () => ({
      success: true as const,
      data: 0,
    })),
    is_online: vi.fn(() => true),
    flush_pending_changes: vi.fn(async () => ({
      success: true as const,
      data: { skipped_offline: false },
    })),
    ...overrides,
  };
}

describe("get_logout_warning_modal_state", () => {
  it("reads a fresh outbox count instead of a cached summary", async () => {
    const sync_port = create_sync_port({
      get_unsynced_local_change_count: vi.fn(async () => ({
        success: true as const,
        data: 2,
      })),
    });

    await expect(get_logout_warning_modal_state(sync_port)).resolves.toEqual({
      modal_state: LOGOUT_WARNING_MODAL_STATE.WARNING,
      should_confirm_logout: false,
    });
    expect(sync_port.get_unsynced_local_change_count).toHaveBeenCalledTimes(1);
  });

  it("warns about offline data loss when changes are pending offline", async () => {
    const sync_port = create_sync_port({
      get_unsynced_local_change_count: vi.fn(async () => ({
        success: true as const,
        data: 1,
      })),
      is_online: vi.fn(() => false),
    });

    await expect(get_logout_warning_modal_state(sync_port)).resolves.toEqual({
      modal_state: LOGOUT_WARNING_MODAL_STATE.OFFLINE,
      should_confirm_logout: false,
    });
  });

  it("confirms logout straight away when nothing is pending", async () => {
    await expect(
      get_logout_warning_modal_state(create_sync_port()),
    ).resolves.toEqual({
      modal_state: LOGOUT_WARNING_MODAL_STATE.CHECKING,
      should_confirm_logout: true,
    });
  });

  it("never confirms logout when the outbox cannot be read", async () => {
    const sync_port = create_sync_port({
      get_unsynced_local_change_count: vi.fn(async () => ({
        success: false as const,
        error: "IndexedDB unavailable",
      })),
    });

    await expect(get_logout_warning_modal_state(sync_port)).resolves.toEqual({
      modal_state: LOGOUT_WARNING_MODAL_STATE.COUNT_UNAVAILABLE,
      should_confirm_logout: false,
    });
  });
});

describe("sync_logout_warning_modal_changes", () => {
  it("maps sync results to modal outcomes", async () => {
    const flush_pending_changes = vi
      .fn()
      .mockResolvedValueOnce({ success: true, data: { skipped_offline: true } })
      .mockResolvedValueOnce({ success: false, error: "network failed" })
      .mockResolvedValueOnce({
        success: true,
        data: { skipped_offline: false },
      });
    const sync_port = create_sync_port({ flush_pending_changes });

    await expect(sync_logout_warning_modal_changes(sync_port)).resolves.toEqual(
      {
        modal_state: LOGOUT_WARNING_MODAL_STATE.OFFLINE,
        should_confirm_logout: false,
        sync_error_message: "",
      },
    );
    await expect(sync_logout_warning_modal_changes(sync_port)).resolves.toEqual(
      {
        modal_state: LOGOUT_WARNING_MODAL_STATE.SYNC_FAILED,
        should_confirm_logout: false,
        sync_error_message:
          "Failed to sync changes to the server. Your local data may be lost if you logout.",
      },
    );
    await expect(sync_logout_warning_modal_changes(sync_port)).resolves.toEqual(
      {
        modal_state: LOGOUT_WARNING_MODAL_STATE.SYNCING,
        should_confirm_logout: true,
        sync_error_message: "",
      },
    );
  });
});
