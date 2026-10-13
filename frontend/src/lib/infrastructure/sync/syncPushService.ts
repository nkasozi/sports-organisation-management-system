import {
  type SyncOutboxEntry,
  SyncOutboxOperation,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { list_pending_entries_for_table } from "./syncOutboxRepository";
import { push_outbox_deletes } from "./syncPushDeletes";
import {
  merge_push_summaries,
  type PushTableOutboxCommand,
  type PushTableOutboxSummary,
} from "./syncPushTransport";
import { push_outbox_upserts } from "./syncPushUpserts";

async function load_pending_entries(
  command: PushTableOutboxCommand,
): AsyncResult<SyncOutboxEntry[]> {
  try {
    return create_success_result(
      await list_pending_entries_for_table(
        command.database,
        command.table_name,
      ),
    );
  } catch (error) {
    console.error("[Sync:Push] Failed to read the outbox", {
      event: "sync_push_outbox_read_failed",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

function log_push_summary(
  command: PushTableOutboxCommand,
  summary: PushTableOutboxSummary,
): PushTableOutboxSummary {
  console.log("[Sync:Push] Table outbox drained", {
    event: "sync_push_table_completed",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    records_pushed: summary.records_pushed,
    conflict_count: summary.conflicts.length,
    rejected_count: summary.rejected.length,
  });
  for (const rejected of summary.rejected)
    console.warn("[Sync:Push] Server rejected a local change", {
      event: "sync_push_record_rejected",
      correlation_id: command.correlation_id,
      table_name: rejected.table_name,
      local_id: rejected.local_id,
      rejection_code: rejected.rejection_code,
    });
  return summary;
}

export async function push_table_outbox_to_convex(
  command: PushTableOutboxCommand,
): AsyncResult<PushTableOutboxSummary> {
  const entries_result = await load_pending_entries(command);
  if (!entries_result.success) return entries_result;
  try {
    const upserts = await push_outbox_upserts(
      command,
      entries_result.data.filter(
        (entry) => entry.operation === SyncOutboxOperation.UPSERT,
      ),
    );
    if (!upserts.success) return upserts;
    const deletes = await push_outbox_deletes(
      command,
      entries_result.data.filter(
        (entry) => entry.operation === SyncOutboxOperation.DELETE,
      ),
    );
    if (!deletes.success) return deletes;
    return create_success_result(
      log_push_summary(
        command,
        merge_push_summaries(upserts.data, deletes.data),
      ),
    );
  } catch (error) {
    console.error("[Sync:Push] Outbox push failed", {
      event: "sync_push_operation_failed",
      correlation_id: command.correlation_id,
      table_name: command.table_name,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}
