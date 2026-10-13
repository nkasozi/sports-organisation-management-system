import { describe, expect, it } from "vitest";

import { create_idle_storage_backup_restore_state } from "./storageBackupRestoreMachine";
import {
  awaiting_state,
  blocked_pending_state,
  blocked_session_state,
  expect_rejected_transition,
  expect_transition,
  failed_state,
  idle_state,
  pending_event,
  prepared_restore,
  restoring_state,
  session_event,
  succeeded_state,
  summary,
  validating_state,
} from "./storageBackupRestoreMachineTestFixtures";

describe("create_idle_storage_backup_restore_state", () => {
  it("starts in the idle state", () => {
    expect(create_idle_storage_backup_restore_state()).toEqual(idle_state);
  });
});

describe("transition_storage_backup_restore_state", () => {
  it("moves from idle to validating when a backup is selected", () => {
    expect_transition(
      idle_state,
      { type: "backup_selected" },
      validating_state,
    );
  });

  it("allows selecting another backup from every settled state", () => {
    for (const settled_state of [
      failed_state,
      blocked_pending_state,
      blocked_session_state,
      succeeded_state,
    ]) {
      expect_transition(
        settled_state,
        { type: "backup_selected" },
        validating_state,
      );
    }
  });

  it("awaits confirmation after validation passes", () => {
    expect_transition(
      validating_state,
      { type: "validation_passed", prepared_restore },
      awaiting_state,
    );
  });

  it("fails when validation fails", () => {
    expect_transition(
      validating_state,
      { type: "validation_failed", error: "Backup JSON is invalid" },
      failed_state,
    );
  });

  it("blocks during validation or restore when pending local changes exist", () => {
    expect_transition(validating_state, pending_event, blocked_pending_state);
    expect_transition(restoring_state, pending_event, blocked_pending_state);
  });

  it("blocks during validation or restore when the session does not allow the backup", () => {
    expect_transition(validating_state, session_event, blocked_session_state);
    expect_transition(restoring_state, session_event, blocked_session_state);
  });

  it("restores only after explicit confirmation", () => {
    expect_transition(
      awaiting_state,
      { type: "restore_confirmed" },
      restoring_state,
    );
  });

  it("returns to idle when the user cancels the confirmation", () => {
    expect_transition(
      awaiting_state,
      { type: "restore_cancelled" },
      idle_state,
    );
  });

  it("settles a restore as succeeded or failed", () => {
    expect_transition(
      restoring_state,
      { type: "restore_succeeded", summary },
      succeeded_state,
    );
    expect_transition(
      restoring_state,
      { type: "restore_failed", error: "Storage backup restore failed" },
      { status: "failed", error: "Storage backup restore failed" },
    );
  });

  it("resets settled states back to idle", () => {
    for (const settled_state of [
      failed_state,
      blocked_pending_state,
      blocked_session_state,
      succeeded_state,
    ]) {
      expect_transition(settled_state, { type: "reset" }, idle_state);
    }
  });

  it("rejects confirming a restore that has not been validated", () => {
    expect_rejected_transition(idle_state, { type: "restore_confirmed" });
    expect_rejected_transition(validating_state, { type: "restore_confirmed" });
    expect_rejected_transition(failed_state, { type: "restore_confirmed" });
    expect_rejected_transition(blocked_pending_state, {
      type: "restore_confirmed",
    });
  });

  it("rejects selecting a new backup while validating, confirming, or restoring", () => {
    expect_rejected_transition(validating_state, { type: "backup_selected" });
    expect_rejected_transition(awaiting_state, { type: "backup_selected" });
    expect_rejected_transition(restoring_state, { type: "backup_selected" });
  });

  it("rejects cancelling or resetting while a restore is running", () => {
    expect_rejected_transition(restoring_state, { type: "restore_cancelled" });
    expect_rejected_transition(restoring_state, { type: "reset" });
  });

  it("rejects restore outcomes outside the restoring state", () => {
    expect_rejected_transition(awaiting_state, {
      type: "restore_succeeded",
      summary,
    });
    expect_rejected_transition(idle_state, {
      type: "restore_failed",
      error: "Storage backup restore failed",
    });
  });
});
