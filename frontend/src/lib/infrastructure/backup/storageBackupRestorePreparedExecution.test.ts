import { assert, beforeEach, describe, expect, it } from "vitest";

import { create_failure_result } from "$lib/core/types/Result";

import type { PreparedStorageBackupRestore } from "./storageBackupContracts";
import {
  type CoordinatorTestConfiguration,
  type CoordinatorTestSubject,
  create_coordinator_test_subject,
  create_default_coordinator_test_configuration,
  created_backup_timestamp,
  serialize_test_backup,
  verified_session_marker_state,
  verified_user_marker_state,
} from "./storageBackupCoordinatorTestHarness";

const expected_summary = {
  created_at: created_backup_timestamp,
  source: "manual_export",
  total_tables: 37,
  tables_with_records: 1,
  total_records: 1,
  session_sync_marker_state: verified_session_marker_state,
};

describe("restore_prepared_backup", () => {
  let configuration: CoordinatorTestConfiguration;

  beforeEach(() => {
    configuration = create_default_coordinator_test_configuration();
  });

  async function prepare_restore(
    subject: CoordinatorTestSubject["subject"],
  ): Promise<PreparedStorageBackupRestore> {
    const event = await subject.prepare_backup_restore(
      serialize_test_backup([{ id: "team-1", name: "Cranes" }]),
    );

    assert(event.type === "validation_passed");

    return event.prepared_restore;
  }

  it("suspends sync, writes everything in one atomic step, then resumes sync", async () => {
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);
    const prepared_restore = await prepare_restore(subject);

    const event = await subject.restore_prepared_backup(prepared_restore);

    expect(event).toEqual({
      type: "restore_succeeded",
      summary: expected_summary,
    });
    expect(recorder.call_order).toEqual([
      "stop_background_sync",
      "stop_remote_sync",
      "set_pulling_from_remote:true",
      "replace_all_tables_atomically",
      "set_pulling_from_remote:false",
      "start_remote_sync",
      "start_background_sync",
    ]);
    expect(recorder.replace_commands).toHaveLength(1);
    expect(recorder.replace_commands[0].table_snapshots).toEqual(
      prepared_restore.validated_table_snapshots,
    );
    expect(recorder.persisted_bootstrap_states).toEqual([
      { app_initialized: true, seeding_complete: true },
    ]);
    expect(recorder.persisted_marker_states).toEqual([
      verified_session_marker_state,
    ]);
  });

  it("rebinds a same-user backup from an earlier session to the current session", async () => {
    configuration.restore_safety = {
      status: "safe_matching_verified_user",
      session_id: "session-2",
      user_id: "user-1",
    };
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);
    const event = await subject.prepare_backup_restore(
      serialize_test_backup(
        [{ id: "team-1", name: "Cranes" }],
        verified_user_marker_state,
      ),
    );
    assert(event.type === "validation_passed");

    await subject.restore_prepared_backup(event.prepared_restore);

    expect(recorder.persisted_marker_states).toEqual([
      {
        status: "present",
        marker: {
          mode: "verified_user",
          session_id: "session-2",
          user_id: "user-1",
        },
      },
    ]);
  });

  it("reports failure and still resumes sync when the atomic write fails", async () => {
    configuration.replace_result = create_failure_result("Transaction aborted");
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);
    const prepared_restore = await prepare_restore(subject);

    const event = await subject.restore_prepared_backup(prepared_restore);

    expect(event).toEqual({
      type: "restore_failed",
      error: "Storage backup restore failed",
    });
    expect(recorder.call_order).toContain("set_pulling_from_remote:false");
    expect(recorder.call_order).toContain("start_background_sync");
  });

  it("only resumes the sync loops that were running before the restore", async () => {
    configuration.background_sync_was_running = false;
    configuration.remote_sync_was_running = false;
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);
    const prepared_restore = await prepare_restore(subject);

    await subject.restore_prepared_backup(prepared_restore);

    expect(recorder.call_order).not.toContain("start_background_sync");
    expect(recorder.call_order).not.toContain("start_remote_sync");
  });

  it("re-checks pending local changes right before the destructive step", async () => {
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);
    const prepared_restore = await prepare_restore(subject);
    configuration.pending_local_change_state = {
      status: "pending_local_changes_present",
    };

    const event = await subject.restore_prepared_backup(prepared_restore);

    expect(event).toEqual({
      type: "pending_local_changes_detected",
      summary: expected_summary,
    });
    expect(recorder.call_order).toEqual([]);
  });

  it("re-checks session safety right before the destructive step", async () => {
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);
    const prepared_restore = await prepare_restore(subject);
    configuration.restore_safety = {
      status: "blocked_active_session_mismatch",
    };

    const event = await subject.restore_prepared_backup(prepared_restore);

    expect(event).toEqual({
      type: "session_mismatch_detected",
      summary: expected_summary,
      safety_status: "blocked_active_session_mismatch",
    });
    expect(recorder.replace_commands).toEqual([]);
  });
});
