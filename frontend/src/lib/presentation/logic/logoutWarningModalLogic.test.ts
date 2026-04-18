import { describe, expect, it, vi } from "vitest";

import {
  get_logout_warning_modal_state,
  sync_logout_warning_modal_changes,
} from "./logoutWarningModalLogic";

const {
  flush_pending_changes_mock,
  get_background_sync_status_mock,
  has_pending_unsynced_changes_mock,
} = vi.hoisted(() => ({
  flush_pending_changes_mock: vi.fn(),
  get_background_sync_status_mock: vi.fn(),
  has_pending_unsynced_changes_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/sync/backgroundSyncService", () => ({
  flush_pending_changes: flush_pending_changes_mock,
  get_background_sync_status: get_background_sync_status_mock,
  has_pending_unsynced_changes: has_pending_unsynced_changes_mock,
}));

describe("logoutWarningModalLogic", () => {
  it("returns offline, warning, or checking states based on sync status", () => {
    get_background_sync_status_mock.mockReturnValue({
      is_online: false,
      has_pending_changes: true,
    });
    has_pending_unsynced_changes_mock.mockReturnValue(false);

    expect(get_logout_warning_modal_state()).toEqual({
      modal_state: "offline",
      should_confirm_logout: false,
    });

    get_background_sync_status_mock.mockReturnValue({
      is_online: true,
      has_pending_changes: true,
    });
    has_pending_unsynced_changes_mock.mockReturnValue(true);

    expect(get_logout_warning_modal_state()).toEqual({
      modal_state: "warning",
      should_confirm_logout: false,
    });

    has_pending_unsynced_changes_mock.mockReturnValue(false);
    expect(get_logout_warning_modal_state()).toEqual({
      modal_state: "checking",
      should_confirm_logout: true,
    });
  });

  it("maps sync results to modal outcomes", async () => {
    flush_pending_changes_mock.mockResolvedValueOnce({
      success: true,
      data: { skipped_offline: true },
    });
    await expect(sync_logout_warning_modal_changes()).resolves.toEqual({
      modal_state: "offline",
      should_confirm_logout: false,
      sync_error_message: "",
    });

    flush_pending_changes_mock.mockResolvedValueOnce({
      success: false,
      error: "network failed",
    });
    await expect(sync_logout_warning_modal_changes()).resolves.toEqual({
      modal_state: "sync_failed",
      should_confirm_logout: false,
      sync_error_message:
        "Failed to sync changes to the server. Your local data may be lost if you logout.",
    });

    flush_pending_changes_mock.mockResolvedValueOnce({
      success: true,
      data: { skipped_offline: false },
    });
    await expect(sync_logout_warning_modal_changes()).resolves.toEqual({
      modal_state: "syncing",
      should_confirm_logout: true,
      sync_error_message: "",
    });
  });
});
