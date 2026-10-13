import { beforeEach, describe, expect, it } from "vitest";

import { build_storage_backup_import_view } from "$lib/presentation/components/settings/settingsDataImportView";

import {
  type CoordinatorTestConfiguration,
  create_coordinator_test_subject,
  create_default_coordinator_test_configuration,
  serialize_test_backup,
} from "./storageBackupCoordinatorTestHarness";
import {
  expect_transition,
  restoring_state,
  summary,
  validating_state,
} from "./storageBackupRestoreMachineTestFixtures";

const LOCAL_CHANGE_CHECK_FAILED = "local_change_check_failed";
const BLOCKED_LOCAL_CHANGE_CHECK_FAILED = "blocked_local_change_check_failed";

describe("restore guard when the unsynced change count cannot be read", () => {
  let configuration: CoordinatorTestConfiguration;

  beforeEach(() => {
    configuration = create_default_coordinator_test_configuration();
    configuration.pending_local_change_state = {
      status: "count_unavailable",
      error: "IndexedDB unavailable",
    };
  });

  it("blocks preparation instead of assuming there are no pending changes", async () => {
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);

    const event = await subject.prepare_backup_restore(
      serialize_test_backup([{ id: "team-1" }]),
    );

    expect(event.type).toBe(LOCAL_CHANGE_CHECK_FAILED);
    expect(recorder.call_order).toEqual([]);
  });

  it("refuses a device restore without touching local data", async () => {
    configuration.read_state = {
      status: "available",
      serialized_backup: serialize_test_backup([{ id: "team-1" }]),
    };
    const { subject, recorder } =
      create_coordinator_test_subject(configuration);

    const result = await subject.restore_from_device_backup();

    expect(result).toEqual({
      success: false,
      error:
        "Backup restore blocked because unsynced changes could not be checked",
    });
    expect(recorder.call_order).toEqual([]);
  });
});

describe("restore machine and view for a failed local change check", () => {
  it("moves validating and restoring into the dedicated blocked state", () => {
    for (const current_state of [validating_state, restoring_state]) {
      expect_transition(
        current_state,
        { type: LOCAL_CHANGE_CHECK_FAILED, summary },
        { status: BLOCKED_LOCAL_CHANGE_CHECK_FAILED, summary },
      );
    }
  });

  it("explains the blocked state to the user", () => {
    const view = build_storage_backup_import_view({
      status: BLOCKED_LOCAL_CHANGE_CHECK_FAILED,
      summary,
    });

    expect(view).toMatchObject({ status: "notice", tone: "warning" });
    if (view.status !== "notice") return;
    expect(view.message).toContain("could not check");
  });
});
