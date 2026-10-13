import { describe, expect, it, vi } from "vitest";

import {
  begin_storage_backup_import,
  build_storage_backup_download_file_name,
  export_storage_backup_json,
  get_storage_backup_support_message,
} from "./settingsDataManagementLogic";
import {
  awaiting_state,
  prepared_restore,
  summary,
} from "./settingsDataManagementTestFixtures";

describe("build_storage_backup_download_file_name", () => {
  it("creates a stable json filename from the backup timestamp", () => {
    expect(
      build_storage_backup_download_file_name("2026-05-17T12:00:00.000Z"),
    ).toBe("sports-org-backup-2026-05-17T12-00-00.000Z.json");
  });
});

describe("get_storage_backup_support_message", () => {
  it("explains that automatic device backups live in this browser and only cover local corruption", () => {
    expect(get_storage_backup_support_message({ status: "supported" })).toBe(
      "Automatic device backups are stored inside this browser's own storage. They only help recover from local database corruption and are erased together with this site's data if browser data is cleared. Use Export All Data to keep a backup file outside this browser.",
    );
  });

  it("points to manual export when device backups are unavailable", () => {
    expect(get_storage_backup_support_message({ status: "unsupported" })).toBe(
      "Automatic device backups are unavailable in this browser. Use Export All Data to keep a backup file outside this browser.",
    );
  });
});

describe("export_storage_backup_json", () => {
  it("downloads the manual backup and shows a success toast", async () => {
    const download_file = vi.fn();
    const show_toast = vi.fn();

    const result = await export_storage_backup_json({
      create_manual_backup_json: async () => ({
        success: true,
        data: { serialized_backup: '{"format_version":1}', summary },
      }),
      download_file,
      show_toast,
    });

    expect(result).toBe(true);
    expect(download_file).toHaveBeenCalledWith(
      "sports-org-backup-2026-05-17T12-00-00.000Z.json",
      '{"format_version":1}',
    );
    expect(show_toast).toHaveBeenCalledWith(
      "Backup exported successfully",
      "success",
    );
  });

  it("shows an error toast when export fails", async () => {
    const download_file = vi.fn();
    const show_toast = vi.fn();

    const result = await export_storage_backup_json({
      create_manual_backup_json: async () => ({
        success: false,
        error: "Backup export failed",
      }),
      download_file,
      show_toast,
    });

    expect(result).toBe(false);
    expect(download_file).not.toHaveBeenCalled();
    expect(show_toast).toHaveBeenCalledWith("Backup export failed", "error");
  });
});

describe("begin_storage_backup_import", () => {
  it("validates the selected file and waits for confirmation without restoring", async () => {
    const prepare_backup_restore = vi.fn(async () => ({
      type: "validation_passed" as const,
      prepared_restore,
    }));

    const next_state = await begin_storage_backup_import({
      current_state: { status: "idle" },
      publish_state: vi.fn(() => true),
      load_serialized_backup: async () => '{"format_version":1}',
      prepare_backup_restore,
    });

    expect(next_state).toEqual(awaiting_state);
    expect(prepare_backup_restore).toHaveBeenCalledWith('{"format_version":1}');
  });

  it("moves to blocked when unsynced local changes exist", async () => {
    const next_state = await begin_storage_backup_import({
      current_state: { status: "idle" },
      publish_state: vi.fn(() => true),
      load_serialized_backup: async () => "{}",
      prepare_backup_restore: async () => ({
        type: "pending_local_changes_detected",
        summary,
      }),
    });

    expect(next_state).toEqual({
      status: "blocked_pending_local_changes",
      summary,
    });
  });

  it("fails when the selected file cannot be read", async () => {
    const prepare_backup_restore = vi.fn();

    const next_state = await begin_storage_backup_import({
      current_state: { status: "idle" },
      publish_state: vi.fn(() => true),
      load_serialized_backup: async () =>
        Promise.reject(new Error("NotReadableError")),
      prepare_backup_restore,
    });

    expect(next_state).toEqual({
      status: "failed",
      error: "Backup file could not be read",
    });
    expect(prepare_backup_restore).not.toHaveBeenCalled();
  });

  it("ignores a new file while a confirmation is pending", async () => {
    const prepare_backup_restore = vi.fn();

    const next_state = await begin_storage_backup_import({
      current_state: awaiting_state,
      publish_state: vi.fn(() => true),
      load_serialized_backup: async () => "{}",
      prepare_backup_restore,
    });

    expect(next_state).toEqual(awaiting_state);
    expect(prepare_backup_restore).not.toHaveBeenCalled();
  });
});
