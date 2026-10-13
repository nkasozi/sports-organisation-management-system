import { beforeEach, describe, expect, it } from "vitest";

import {
  type CoordinatorTestConfiguration,
  create_coordinator_test_subject,
  create_default_coordinator_test_configuration,
} from "./storageBackupCoordinatorTestHarness";
import { STORAGE_BACKUP_RESTORE_EVENT } from "./storageBackupRestoreTypes";

const conflicted_outbox_entry = {
  table_name: "teams",
  local_id: "team-1",
  operation: "upsert" as const,
  base_version: { kind: "known" as const, version: 3 },
  change_token: "token-1",
  enqueued_at: "2026-05-17T12:00:00.000Z",
  status: "conflicted" as const,
  remote_version: 5,
};

async function export_then_restore(
  configuration: CoordinatorTestConfiguration,
): Promise<{
  test_subject: ReturnType<typeof create_coordinator_test_subject>;
  outcome_type: string;
}> {
  const test_subject = create_coordinator_test_subject(configuration);
  const export_result = await test_subject.subject.create_manual_backup_json();
  if (!export_result.success) return { test_subject, outcome_type: "" };
  const preparation = await test_subject.subject.prepare_backup_restore(
    export_result.data.serialized_backup,
  );
  if (preparation.type !== STORAGE_BACKUP_RESTORE_EVENT.VALIDATION_PASSED)
    return { test_subject, outcome_type: preparation.type };
  const outcome = await test_subject.subject.restore_prepared_backup(
    preparation.prepared_restore,
  );
  return { test_subject, outcome_type: outcome.type };
}

describe("restoring sync bookkeeping from a backup", () => {
  let configuration: CoordinatorTestConfiguration;

  beforeEach(() => {
    configuration = create_default_coordinator_test_configuration();
    configuration.sync_bookkeeping = {
      outbox_entries: [conflicted_outbox_entry],
      record_versions: [
        { table_name: "teams", local_id: "team-1", server_version: 3 },
      ],
    };
  });

  it("carries unpushed outbox entries and known versions through export and restore", async () => {
    const { test_subject, outcome_type } =
      await export_then_restore(configuration);

    expect(outcome_type).toBe(STORAGE_BACKUP_RESTORE_EVENT.RESTORE_SUCCEEDED);
    expect(test_subject.recorder.replace_commands[0].sync_bookkeeping).toEqual(
      configuration.sync_bookkeeping,
    );
  });

  it("does not persist the session marker when the bootstrap state cannot be saved", async () => {
    configuration.bootstrap_persist_succeeds = false;

    const { test_subject } = await export_then_restore(configuration);

    expect(test_subject.recorder.persisted_bootstrap_states).toHaveLength(1);
    expect(test_subject.recorder.persisted_marker_states).toEqual([]);
  });
});
