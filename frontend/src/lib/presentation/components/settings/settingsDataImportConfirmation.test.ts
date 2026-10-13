import { describe, expect, it, vi } from "vitest";

import {
  cancel_storage_backup_import,
  confirm_storage_backup_import,
  dismiss_storage_backup_import,
} from "./settingsDataManagementLogic";
import {
  awaiting_state,
  prepared_restore,
  summary,
} from "./settingsDataManagementTestFixtures";

describe("confirm_storage_backup_import", () => {
  it("restores the prepared backup, shows a success toast, and refreshes the app", async () => {
    const show_toast = vi.fn();
    const refresh_page = vi.fn();
    const restore_prepared_backup = vi.fn(async () => ({
      type: "restore_succeeded" as const,
      summary,
    }));

    const next_state = await confirm_storage_backup_import({
      current_state: awaiting_state,
      publish_state: vi.fn(() => true),
      restore_prepared_backup,
      show_toast,
      refresh_page,
    });

    expect(next_state).toEqual({ status: "succeeded", summary });
    expect(restore_prepared_backup).toHaveBeenCalledWith(prepared_restore);
    expect(show_toast).toHaveBeenCalledWith(
      "Backup imported successfully. Reloading application...",
      "success",
    );
    expect(refresh_page).toHaveBeenCalledOnce();
  });

  it("reports a failed restore without refreshing", async () => {
    const show_toast = vi.fn();
    const refresh_page = vi.fn();

    const next_state = await confirm_storage_backup_import({
      current_state: awaiting_state,
      publish_state: vi.fn(() => true),
      restore_prepared_backup: async () => ({
        type: "restore_failed",
        error: "Storage backup restore failed",
      }),
      show_toast,
      refresh_page,
    });

    expect(next_state).toEqual({
      status: "failed",
      error: "Storage backup restore failed",
    });
    expect(show_toast).toHaveBeenCalledWith(
      "Storage backup restore failed",
      "error",
    );
    expect(refresh_page).not.toHaveBeenCalled();
  });

  it("does nothing when there is no validated backup awaiting confirmation", async () => {
    const restore_prepared_backup = vi.fn();

    const next_state = await confirm_storage_backup_import({
      current_state: { status: "idle" },
      publish_state: vi.fn(() => true),
      restore_prepared_backup,
      show_toast: vi.fn(),
      refresh_page: vi.fn(),
    });

    expect(next_state).toEqual({ status: "idle" });
    expect(restore_prepared_backup).not.toHaveBeenCalled();
  });
});

describe("cancel_storage_backup_import and dismiss_storage_backup_import", () => {
  it("returns to idle when the confirmation is cancelled", () => {
    expect(cancel_storage_backup_import(awaiting_state)).toEqual({
      status: "idle",
    });
  });

  it("returns to idle when a settled message is dismissed", () => {
    expect(
      dismiss_storage_backup_import({
        status: "blocked_pending_local_changes",
        summary,
      }),
    ).toEqual({ status: "idle" });
  });
});
