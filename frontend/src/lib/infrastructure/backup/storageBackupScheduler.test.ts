import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import type {
  DeviceBackupCapabilityState,
  DeviceBackupWriteOutcome,
} from "./storageBackupContracts";
import type { PersistentStorageRequestState } from "./storageBackupPersistence";
import { create_storage_backup_scheduler } from "./storageBackupScheduler";

describe("create_storage_backup_scheduler", () => {
  const written_outcome: DeviceBackupWriteOutcome = {
    status: "written",
    summary: {
      created_at: "2026-05-17T12:00:00.000Z",
      source: "device_automatic",
      total_tables: 37,
      tables_with_records: 1,
      total_records: 1,
      session_sync_marker_state: {
        status: "present",
        marker: { mode: "anonymous" },
      },
    },
  };

  function create_subject(
    capability: DeviceBackupCapabilityState,
    write_outcome: DeviceBackupWriteOutcome = written_outcome,
    is_browser_environment: boolean = true,
  ): {
    scheduler: ReturnType<typeof create_storage_backup_scheduler>;
    write_device_backup: Mock<() => AsyncResult<DeviceBackupWriteOutcome>>;
    request_persistent_storage_once: Mock<
      () => Promise<PersistentStorageRequestState>
    >;
  } {
    const write_device_backup = vi.fn(
      async (): AsyncResult<DeviceBackupWriteOutcome> =>
        create_success_result(write_outcome),
    );
    const request_persistent_storage_once = vi.fn(
      async (): Promise<PersistentStorageRequestState> => ({
        status: "granted",
      }),
    );
    const scheduler = create_storage_backup_scheduler({
      get_coordinator: () => ({
        get_device_backup_capability: () => capability,
        write_device_backup,
      }),
      request_persistent_storage_once,
      is_browser_environment: () => is_browser_environment,
      schedule_delay_ms: 3000,
    });

    return { scheduler, write_device_backup, request_persistent_storage_once };
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not schedule writes outside the browser", () => {
    const { scheduler, write_device_backup } = create_subject(
      { status: "supported" },
      written_outcome,
      false,
    );

    expect(scheduler.schedule()).toBe(false);
    vi.runAllTimers();
    expect(write_device_backup).not.toHaveBeenCalled();
  });

  it("does not schedule writes or request persistence when device backup is unsupported", () => {
    const { scheduler, write_device_backup, request_persistent_storage_once } =
      create_subject({ status: "unsupported" });

    expect(scheduler.schedule()).toBe(false);
    vi.runAllTimers();
    expect(write_device_backup).not.toHaveBeenCalled();
    expect(request_persistent_storage_once).not.toHaveBeenCalled();
  });

  it("requests persistent storage when automatic backups are enabled", () => {
    const { scheduler, request_persistent_storage_once } = create_subject({
      status: "supported",
    });

    scheduler.schedule();
    scheduler.schedule();

    expect(request_persistent_storage_once).toHaveBeenCalled();
  });

  it("debounces multiple schedule requests into a single device backup write", async () => {
    const { scheduler, write_device_backup } = create_subject({
      status: "supported",
    });

    expect(scheduler.schedule()).toBe(true);
    expect(scheduler.schedule()).toBe(true);
    vi.advanceTimersByTime(3000);
    await Promise.resolve();

    expect(write_device_backup).toHaveBeenCalledOnce();
  });

  it("accepts a skipped write outcome as an explicit non-failure", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { scheduler, write_device_backup } = create_subject(
      { status: "supported" },
      {
        status: "skipped_not_restorable",
        safety_status: "blocked_signed_out_unmarked_backup",
      },
    );

    scheduler.schedule();
    vi.advanceTimersByTime(3000);
    await Promise.resolve();
    await Promise.resolve();

    expect(write_device_backup).toHaveBeenCalledOnce();
    expect(warn_spy).not.toHaveBeenCalled();
    warn_spy.mockRestore();
  });

  it("cancels a pending device backup write", async () => {
    const { scheduler, write_device_backup } = create_subject({
      status: "supported",
    });

    scheduler.schedule();
    expect(scheduler.cancel()).toBe(true);
    vi.advanceTimersByTime(3000);
    await Promise.resolve();

    expect(write_device_backup).not.toHaveBeenCalled();
    expect(scheduler.cancel()).toBe(false);
  });
});
