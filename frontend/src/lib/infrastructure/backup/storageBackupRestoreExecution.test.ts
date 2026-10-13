import { beforeEach, describe, expect, it } from "vitest";

import {
  type CoordinatorTestConfiguration,
  create_coordinator_test_subject,
  create_default_coordinator_test_configuration,
  created_backup_timestamp,
  serialize_test_backup,
  verified_session_marker_state,
} from "./storageBackupCoordinatorTestHarness";

const expected_summary = {
  created_at: created_backup_timestamp,
  source: "manual_export",
  total_tables: 37,
  tables_with_records: 1,
  total_records: 1,
  session_sync_marker_state: verified_session_marker_state,
};

describe("prepare_backup_restore", () => {
  let configuration: CoordinatorTestConfiguration;

  beforeEach(() => {
    configuration = create_default_coordinator_test_configuration();
  });

  it("validates a backup without touching local data", async () => {
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);

    const event = await subject.prepare_backup_restore(
      serialize_test_backup([{ id: "team-1", name: "Cranes" }]),
    );

    expect(event.type).toBe("validation_passed");
    if (event.type !== "validation_passed") {
      return;
    }
    expect(event.prepared_restore.summary).toEqual(expected_summary);
    expect(
      event.prepared_restore.validated_table_snapshots.find(
        (snapshot) => snapshot.table_name === "teams",
      )?.records,
    ).toEqual([{ id: "team-1", name: "Cranes" }]);
    expect(recorder.call_order).toEqual([]);
  });

  it("fails validation for malformed JSON", async () => {
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);

    const event = await subject.prepare_backup_restore("{broken");

    expect(event).toEqual({
      type: "validation_failed",
      error: "Backup JSON is invalid",
    });
    expect(recorder.call_order).toEqual([]);
  });

  it("fails validation when a record has no id", async () => {
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);

    const event = await subject.prepare_backup_restore(
      serialize_test_backup([{ name: "Cranes" }]),
    );

    expect(event).toEqual({
      type: "validation_failed",
      error: "Backup contains a record without a valid id (teams)",
    });
    expect(recorder.replace_commands).toEqual([]);
  });

  it("fails validation when a table has duplicate ids", async () => {
    const { subject } = create_coordinator_test_subject(configuration);

    const event = await subject.prepare_backup_restore(
      serialize_test_backup([{ id: "team-1" }, { id: "team-1" }]),
    );

    expect(event).toEqual({
      type: "validation_failed",
      error: "Backup contains duplicate record ids (teams)",
    });
  });

  it("blocks when unsynced local changes are pending", async () => {
    configuration.pending_local_change_state = {
      status: "pending_local_changes_present",
    };
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);

    const event = await subject.prepare_backup_restore(
      serialize_test_backup([{ id: "team-1" }]),
    );

    expect(event).toEqual({
      type: "pending_local_changes_detected",
      summary: expected_summary,
    });
    expect(recorder.call_order).toEqual([]);
  });

  it("blocks when the session does not allow the backup", async () => {
    configuration.restore_safety = {
      status: "blocked_signed_out_verified_backup",
    };
    const { subject } = create_coordinator_test_subject(configuration);

    const event = await subject.prepare_backup_restore(
      serialize_test_backup([{ id: "team-1" }]),
    );

    expect(event).toEqual({
      type: "session_mismatch_detected",
      summary: expected_summary,
      safety_status: "blocked_signed_out_verified_backup",
    });
  });
});

describe("restore_from_device_backup", () => {
  let configuration: CoordinatorTestConfiguration;

  beforeEach(() => {
    configuration = create_default_coordinator_test_configuration();
  });

  it("restores a valid device backup", async () => {
    configuration.read_state = {
      status: "available",
      serialized_backup: serialize_test_backup([{ id: "team-1" }]),
    };
    const { subject } = create_coordinator_test_subject(configuration);

    const result = await subject.restore_from_device_backup();

    expect(result).toEqual({ success: true, data: expected_summary });
  });

  it("fails when the device backup is missing", async () => {
    const { subject } = create_coordinator_test_subject(configuration);

    expect(await subject.restore_from_device_backup()).toEqual({
      success: false,
      error: "Device backup is missing",
    });
  });

  it("fails without restoring when the device backup is blocked", async () => {
    configuration.restore_safety = {
      status: "blocked_signed_out_verified_backup",
    };
    configuration.read_state = {
      status: "available",
      serialized_backup: serialize_test_backup([{ id: "team-1" }]),
    };
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);

    expect(await subject.restore_from_device_backup()).toEqual({
      success: false,
      error: "Backup restore blocked for the current session",
    });
    expect(recorder.replace_commands).toEqual([]);
  });
});
