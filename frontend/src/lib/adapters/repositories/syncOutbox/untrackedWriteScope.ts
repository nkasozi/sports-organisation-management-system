import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import type {
  ChangeTrackingGate,
  UntrackedWriteReasonValue,
  UntrackedWriteScope,
} from "./syncChangeTrackingGate";

export async function run_untracked_write_scope<TResult>(
  gate: ChangeTrackingGate,
  reason: UntrackedWriteReasonValue,
  work: (scope: UntrackedWriteScope) => Promise<TResult>,
): AsyncResult<TResult> {
  const scope = gate.begin_untracked_write_scope(reason);
  console.log("[SyncOutbox] Untracked write scope opened", {
    event: "sync_untracked_write_scope_opened",
    reason,
    correlation_id: scope.scope_id,
  });
  try {
    return create_success_result(await work(scope));
  } catch (error) {
    console.error("[SyncOutbox] Untracked write scope work failed", {
      event: "sync_untracked_write_scope_failed",
      reason,
      correlation_id: scope.scope_id,
      error: String(error),
    });
    return create_failure_result(String(error));
  } finally {
    scope.end();
    console.log("[SyncOutbox] Untracked write scope closed", {
      event: "sync_untracked_write_scope_closed",
      reason,
      correlation_id: scope.scope_id,
    });
  }
}
