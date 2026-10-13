import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";

import type {
  StorageBackupSummary,
  StorageStartupRecoveryState,
} from "$lib/infrastructure/backup/storageBackupContracts";

import {
  run_startup_storage_recovery,
  type StartupStorageRecoveryFlowDependencies,
} from "./layoutStartupStorageRecoveryFlow";
import type { StartupStorageRecoveryChoice } from "./layoutStorageRecovery";

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

function create_dependencies(
  recovery_state: StorageStartupRecoveryState,
  choice: StartupStorageRecoveryChoice,
  restore_succeeds: boolean = true,
): {
  [Key in keyof StartupStorageRecoveryFlowDependencies]: Mock<
    StartupStorageRecoveryFlowDependencies[Key]
  >;
} {
  const dependencies = {
    evaluate_startup_recovery: vi.fn(async () => recovery_state),
    restore_from_device_backup: vi.fn(async () =>
      restore_succeeds
        ? { success: true as const, data: summary }
        : { success: false as const, error: "Storage backup restore failed" },
    ),
    wait_for_choice: vi.fn(async () => choice),
    show_restore_progress: vi.fn(() => true),
    hide_restore_progress: vi.fn(() => true),
  } satisfies StartupStorageRecoveryFlowDependencies;

  return dependencies;
}

describe("run_startup_storage_recovery", () => {
  it("restores after the user chooses restore", async () => {
    const dependencies = create_dependencies(
      { status: "restore_available", summary },
      "restore",
    );

    expect(await run_startup_storage_recovery(dependencies)).toEqual({
      status: "restored",
    });
    expect(dependencies.wait_for_choice).toHaveBeenCalledWith({
      status: "visible",
      mode: "available",
      summary,
    });
    expect(dependencies.show_restore_progress).toHaveBeenCalledOnce();
    expect(dependencies.hide_restore_progress).toHaveBeenCalledOnce();
  });

  it("does not restore when the user continues fresh", async () => {
    const dependencies = create_dependencies(
      { status: "restore_available", summary },
      "continue",
    );

    expect(await run_startup_storage_recovery(dependencies)).toEqual({
      status: "declined",
    });
    expect(dependencies.restore_from_device_backup).not.toHaveBeenCalled();
  });

  it("reports a failed restore", async () => {
    const dependencies = create_dependencies(
      { status: "restore_available", summary },
      "restore",
      false,
    );

    expect(await run_startup_storage_recovery(dependencies)).toEqual({
      status: "restore_failed",
      error: "Storage backup restore failed",
    });
    expect(dependencies.hide_restore_progress).toHaveBeenCalledOnce();
    expect(dependencies.wait_for_choice).toHaveBeenLastCalledWith({
      status: "visible",
      mode: "failed",
      summary,
    });
  });

  it("shows a blocked prompt and never restores a blocked backup", async () => {
    const dependencies = create_dependencies(
      {
        status: "restore_blocked",
        summary,
        safety_status: "blocked_signed_out_verified_backup",
      },
      "restore",
    );

    expect(await run_startup_storage_recovery(dependencies)).toEqual({
      status: "blocked_acknowledged",
    });
    expect(dependencies.restore_from_device_backup).not.toHaveBeenCalled();
  });

  it("skips the prompt when there is nothing to recover", async () => {
    const dependencies = create_dependencies(
      { status: "backup_missing" },
      "restore",
    );

    expect(await run_startup_storage_recovery(dependencies)).toEqual({
      status: "skipped",
      recovery_status: "backup_missing",
    });
    expect(dependencies.wait_for_choice).not.toHaveBeenCalled();
  });
});
