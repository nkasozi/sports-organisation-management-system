import { describe, expect, it } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import {
  create_change_tracking_gate,
  UntrackedWriteReason,
  type UntrackedWriteScope,
} from "./syncChangeTrackingGate";
import { run_untracked_write_scope } from "./untrackedWriteScope";
import { UntrackedWriteScopeStatus } from "./untrackedWriteScopeToken";

describe("change tracking gate", () => {
  it("tracks every user write by default, independent of any sync engine state", () => {
    const gate = create_change_tracking_gate();
    const user_transaction = { id: "user" };
    expect(gate.should_track_write(user_transaction)).toBe(true);
    expect(gate.describe_untracked_reason(user_transaction).status).toBe(
      OptionStatus.NONE,
    );
  });

  it("excludes only the transaction carrying an explicit marker", () => {
    const gate = create_change_tracking_gate();
    const restore_transaction = { id: "restore" };
    const user_transaction = { id: "user" };
    gate.mark_untracked_transaction(
      restore_transaction,
      UntrackedWriteReason.BACKUP_RESTORE,
    );
    expect(gate.should_track_write(restore_transaction)).toBe(false);
    expect(gate.should_track_write(user_transaction)).toBe(true);
    expect(gate.describe_untracked_reason(restore_transaction)).toEqual({
      status: OptionStatus.SOME,
      value: UntrackedWriteReason.BACKUP_RESTORE,
    });
  });

  it("keeps the remote-apply marker as a named untracked reason", () => {
    const gate = create_change_tracking_gate();
    const remote_transaction = { id: "remote" };
    gate.mark_remote_apply_transaction(remote_transaction);
    expect(gate.describe_untracked_reason(remote_transaction)).toEqual({
      status: OptionStatus.SOME,
      value: UntrackedWriteReason.REMOTE_APPLY,
    });
  });

  it("never marks a transaction just because a scope is open", async () => {
    const gate = create_change_tracking_gate();
    const reset_transaction = { id: "reset" };
    const concurrent_user_transaction = { id: "user_during_reset" };
    const scope_result = await run_untracked_write_scope(
      gate,
      UntrackedWriteReason.DATA_RESET,
      async (scope) => scope.mark_transaction(reset_transaction).success,
    );
    expect(scope_result).toEqual({ success: true, data: true });
    expect(gate.should_track_write(reset_transaction)).toBe(false);
    expect(gate.should_track_write(concurrent_user_transaction)).toBe(true);
  });

  it("refuses to mark transactions once its scope has closed, even after a failure", async () => {
    const gate = create_change_tracking_gate();
    const scopes: UntrackedWriteScope[] = [];
    const failed_scope = await run_untracked_write_scope(
      gate,
      UntrackedWriteReason.DEMO_SEED,
      (scope) => {
        scopes.push(scope);
        return Promise.reject(new Error("seed failed"));
      },
    );
    const late_transaction = { id: "late" };
    expect(failed_scope).toEqual({
      success: false,
      error: "Error: seed failed",
    });
    expect(scopes[0].read_status()).toBe(UntrackedWriteScopeStatus.CLOSED);
    expect(scopes[0].mark_transaction(late_transaction).success).toBe(false);
    expect(gate.should_track_write(late_transaction)).toBe(true);
  });

  it("keeps nested scopes independent and labels each mark with its own reason", async () => {
    const gate = create_change_tracking_gate();
    const outer_transaction = { id: "outer" };
    const inner_transaction = { id: "inner" };
    const outer_result = await run_untracked_write_scope(
      gate,
      UntrackedWriteReason.DATA_RESET,
      async (outer_scope) => {
        const inner_result = await run_untracked_write_scope(
          gate,
          UntrackedWriteReason.DEMO_SEED,
          async (inner_scope) =>
            inner_scope.mark_transaction(inner_transaction).success,
        );
        expect(outer_scope.read_status()).toBe(UntrackedWriteScopeStatus.OPEN);
        const outer_marked = outer_scope.mark_transaction(outer_transaction);
        return inner_result.success && outer_marked.success;
      },
    );
    expect(outer_result).toEqual({ success: true, data: true });
    expect(gate.describe_untracked_reason(inner_transaction)).toEqual({
      status: OptionStatus.SOME,
      value: UntrackedWriteReason.DEMO_SEED,
    });
    expect(gate.describe_untracked_reason(outer_transaction)).toEqual({
      status: OptionStatus.SOME,
      value: UntrackedWriteReason.DATA_RESET,
    });
  });
});
