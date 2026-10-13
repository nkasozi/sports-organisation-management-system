import { describe, expect, it } from "vitest";

import type { StorageBackupSummary } from "$lib/infrastructure/backup/storageBackupContracts";

import {
  build_startup_storage_recovery_prompt_state,
  get_startup_storage_recovery_prompt_message,
  get_startup_storage_recovery_prompt_title,
} from "./layoutStorageRecovery";

const summary: StorageBackupSummary = {
  created_at: "2026-05-17T12:00:00.000Z",
  source: "device_automatic",
  total_tables: 37,
  tables_with_records: 1,
  total_records: 4,
  session_sync_marker_state: {
    status: "present",
    marker: { mode: "anonymous" },
  },
};

describe("build_startup_storage_recovery_prompt_state", () => {
  it("offers restore when the startup backup is available", () => {
    expect(
      build_startup_storage_recovery_prompt_state({
        status: "restore_available",
        summary,
      }),
    ).toEqual({ status: "visible", mode: "available", summary });
  });

  it("shows a blocked prompt with the blocking reason", () => {
    expect(
      build_startup_storage_recovery_prompt_state({
        status: "restore_blocked",
        summary,
        safety_status: "blocked_signed_out_verified_backup",
      }),
    ).toEqual({
      status: "visible",
      mode: "blocked",
      summary,
      safety_status: "blocked_signed_out_verified_backup",
    });
  });

  it("stays hidden for every state that has nothing to offer", () => {
    for (const recovery_state of [
      { status: "backup_missing" as const },
      { status: "device_backup_unsupported" as const },
      { status: "local_data_present" as const },
      { status: "device_backup_read_failed" as const, error: "Read failed" },
      { status: "invalid_device_backup" as const, error: "Invalid" },
    ]) {
      expect(
        build_startup_storage_recovery_prompt_state(recovery_state),
      ).toEqual({ status: "hidden" });
    }
  });
});

describe("get_startup_storage_recovery_prompt_message", () => {
  it("describes an available restore", () => {
    expect(
      get_startup_storage_recovery_prompt_message({
        status: "visible",
        mode: "available",
        summary,
      }),
    ).toBe(
      "A local device backup from this browser is available. Restore it before the app finishes starting?",
    );
  });

  it("describes each blocked reason", () => {
    expect(
      get_startup_storage_recovery_prompt_message({
        status: "visible",
        mode: "blocked",
        summary,
        safety_status: "blocked_active_session_mismatch",
      }),
    ).toBe(
      "This local device backup belongs to a different signed-in session. Continue fresh now and import it manually later if needed.",
    );
    expect(
      get_startup_storage_recovery_prompt_message({
        status: "visible",
        mode: "blocked",
        summary,
        safety_status: "blocked_signed_out_verified_backup",
      }),
    ).toBe(
      "This local device backup belongs to a signed-in session and cannot be restored while signed out.",
    );
    expect(
      get_startup_storage_recovery_prompt_message({
        status: "visible",
        mode: "blocked",
        summary,
        safety_status: "blocked_signed_out_unmarked_backup",
      }),
    ).toBe(
      "This local device backup has no session information and cannot be restored safely.",
    );
  });

  it.each([
    ["blocked_active_user_mismatch", "different account"],
    ["blocked_active_user_unresolved", "could not confirm"],
    ["blocked_legacy_session_mismatch", "older version"],
  ] as const)("describes the %s reason", (safety_status, fragment) => {
    expect(
      get_startup_storage_recovery_prompt_message({
        status: "visible",
        mode: "blocked",
        summary,
        safety_status,
      }),
    ).toContain(fragment);
  });

  it("explains that a failed restore left the device unchanged", () => {
    expect(
      get_startup_storage_recovery_prompt_message({
        status: "visible",
        mode: "failed",
        summary,
      }),
    ).toContain("could not be restored");
  });

  it("titles each prompt mode", () => {
    expect(get_startup_storage_recovery_prompt_title("available")).toBe(
      "Local Backup Found",
    );
    expect(get_startup_storage_recovery_prompt_title("blocked")).toBe(
      "Local Backup Requires Review",
    );
    expect(get_startup_storage_recovery_prompt_title("failed")).toBe(
      "Local Backup Restore Failed",
    );
  });
});
