import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  type CoordinatorTestConfiguration,
  create_coordinator_test_subject,
  create_default_coordinator_test_configuration,
  created_backup_timestamp,
  verified_session_marker_state,
} from "./storageBackupCoordinatorTestHarness";
import { parse_storage_backup_envelope_json } from "./storageBackupParsing";

const expected_device_summary = {
  created_at: created_backup_timestamp,
  source: "manual_export",
  total_tables: 37,
  tables_with_records: 1,
  total_records: 1,
  session_sync_marker_state: verified_session_marker_state,
};

describe("create_storage_backup_coordinator", () => {
  let configuration: CoordinatorTestConfiguration;

  beforeEach(() => {
    configuration = create_default_coordinator_test_configuration();
  });

  it("creates a manual backup JSON payload with the current tables and safe metadata", async () => {
    const { subject } = create_coordinator_test_subject(configuration);

    const result = await subject.create_manual_backup_json();

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.summary).toEqual({
      created_at: created_backup_timestamp,
      source: "manual_export",
      total_tables: 37,
      tables_with_records: 2,
      total_records: 2,
      session_sync_marker_state: verified_session_marker_state,
    });
    const parsed_result = parse_storage_backup_envelope_json(
      result.data.serialized_backup,
    );
    expect(parsed_result.success).toBe(true);
  });

  it("writes the current backup envelope to device storage when it would be restorable", async () => {
    const { subject, write_backup_json_mock } =
      create_coordinator_test_subject(configuration);

    const result = await subject.write_device_backup();

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.status).toBe("written");
    expect(write_backup_json_mock).toHaveBeenCalledOnce();
  });

  it("skips the device write when the backup would not be restorable for the current session", async () => {
    configuration.restore_safety = {
      status: "blocked_signed_out_unmarked_backup",
    };
    const { subject, write_backup_json_mock } =
      create_coordinator_test_subject(configuration);

    const result = await subject.write_device_backup();

    expect(result).toEqual({
      success: true,
      data: {
        status: "skipped_not_restorable",
        safety_status: "blocked_signed_out_unmarked_backup",
      },
    });
    expect(write_backup_json_mock).not.toHaveBeenCalled();
  });

  it("fails the device write when device storage is unsupported", async () => {
    configuration.capability = { status: "unsupported" };
    const { subject } = create_coordinator_test_subject(configuration);

    expect(await subject.write_device_backup()).toEqual({
      success: false,
      error: "Device backup storage is unsupported",
    });
  });

  it("returns the device write failure", async () => {
    const { subject } = create_coordinator_test_subject(
      configuration,
      async () => create_failure_result("Quota exceeded"),
    );

    expect(await subject.write_device_backup()).toEqual({
      success: false,
      error: "Quota exceeded",
    });
  });

  it("waits for an in-flight device write before deleting the device backup", async () => {
    const pending_write: { resolve: (result: Result<boolean>) => void } = {
      resolve: () => {},
    };
    const { subject, recorder, delete_backup_mock, write_backup_json_mock } =
      create_coordinator_test_subject(
        configuration,
        (): AsyncResult<boolean> =>
          new Promise((resolve) => {
            pending_write.resolve = resolve;
          }),
      );

    const write_promise = subject.write_device_backup();
    await vi.waitFor(() => expect(write_backup_json_mock).toHaveBeenCalled());
    const delete_promise = subject.delete_device_backup();
    await Promise.resolve();

    expect(delete_backup_mock).not.toHaveBeenCalled();
    pending_write.resolve(create_success_result(true));
    await write_promise;

    expect(await delete_promise).toEqual({ status: "deleted" });
    expect(recorder.call_order).toEqual(["delete_backup"]);
  });

  it("reports the device delete state", async () => {
    configuration.delete_state = { status: "already_missing" };
    const { subject } = create_coordinator_test_subject(configuration);

    expect(await subject.delete_device_backup()).toEqual({
      status: "already_missing",
    });
  });
});
