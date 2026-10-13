import { beforeEach, describe, expect, it } from "vitest";

import {
  type CoordinatorTestConfiguration,
  create_coordinator_test_subject,
  create_default_coordinator_test_configuration,
  created_backup_timestamp,
  serialize_test_backup,
  verified_session_marker_state,
} from "./storageBackupCoordinatorTestHarness";

const expected_device_summary = {
  created_at: created_backup_timestamp,
  source: "manual_export",
  total_tables: 37,
  tables_with_records: 1,
  total_records: 1,
  session_sync_marker_state: verified_session_marker_state,
};

describe("evaluate_startup_recovery", () => {
  let configuration: CoordinatorTestConfiguration;

  beforeEach(() => {
    configuration = create_default_coordinator_test_configuration();
    configuration.read_state = {
      status: "available",
      serialized_backup: serialize_test_backup([{ id: "team-1" }]),
    };
  });

  it("reports restore availability when local data is empty and the backup is safe", async () => {
    const { subject } = create_coordinator_test_subject(configuration);

    expect(await subject.evaluate_startup_recovery()).toEqual({
      status: "restore_available",
      summary: expected_device_summary,
    });
  });

  it("reports a blocked restore with the blocking reason", async () => {
    configuration.restore_safety = {
      status: "blocked_signed_out_verified_backup",
    };
    const { subject } = create_coordinator_test_subject(configuration);

    expect(await subject.evaluate_startup_recovery()).toEqual({
      status: "restore_blocked",
      summary: expected_device_summary,
      safety_status: "blocked_signed_out_verified_backup",
    });
  });

  it("reports an invalid device backup when a record is malformed", async () => {
    configuration.read_state = {
      status: "available",
      serialized_backup: serialize_test_backup([{ name: "no id" }]),
    };
    const { subject } = create_coordinator_test_subject(configuration);

    expect(await subject.evaluate_startup_recovery()).toEqual({
      status: "invalid_device_backup",
      error: "Backup contains a record without a valid id (teams)",
    });
  });

  it("reports local data present when the database already has records", async () => {
    configuration.total_record_count = 3;
    const { subject } = create_coordinator_test_subject(configuration);

    expect(await subject.evaluate_startup_recovery()).toEqual({
      status: "local_data_present",
    });
  });

  it("probes the local database before parsing the backup so a populated device skips parsing", async () => {
    configuration.total_record_count = 3;
    configuration.read_state = {
      status: "available",
      serialized_backup: "{not json",
    };
    const { subject } = create_coordinator_test_subject(configuration);

    expect(await subject.evaluate_startup_recovery()).toEqual({
      status: "local_data_present",
    });
  });

  it("reports missing, unsupported, and unreadable device backups", async () => {
    configuration.read_state = { status: "missing" };
    expect(
      await create_coordinator_test_subject(
        configuration,
      ).subject.evaluate_startup_recovery(),
    ).toEqual({ status: "backup_missing" });

    configuration.read_state = { status: "unsupported" };
    expect(
      await create_coordinator_test_subject(
        configuration,
      ).subject.evaluate_startup_recovery(),
    ).toEqual({ status: "device_backup_unsupported" });

    configuration.read_state = { status: "failed", error: "Read failed" };
    expect(
      await create_coordinator_test_subject(
        configuration,
      ).subject.evaluate_startup_recovery(),
    ).toEqual({ status: "device_backup_read_failed", error: "Read failed" });
  });
});
