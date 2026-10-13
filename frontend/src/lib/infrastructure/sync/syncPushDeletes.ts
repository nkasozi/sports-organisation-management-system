import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { create_none_option, create_some_option } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import {
  build_rejected_record,
  PushOutcomeKind,
  type PushOutcomeKindValue,
  type ServerRecordResult,
  settle_delete_result,
} from "./syncPushOutcomes";
import {
  create_empty_push_summary,
  merge_push_summaries,
  type PushTableOutboxCommand,
  type PushTableOutboxSummary,
  send_sync_mutation,
} from "./syncPushTransport";

const MAX_SYNC_DELETE_BATCH_SIZE = 25;
const BATCH_DELETE_MUTATION_NAME = "sync:batch_delete";

interface DeleteBatchResponse {
  results: ServerRecordResult[];
  conflicts: Array<{
    local_id: string;
    remote_data: Record<string, unknown>;
    remote_version: number;
  }>;
}

function chunk_entries(entries: SyncOutboxEntry[]): SyncOutboxEntry[][] {
  const chunks: SyncOutboxEntry[][] = [];
  for (
    let start = 0;
    start < entries.length;
    start += MAX_SYNC_DELETE_BATCH_SIZE
  )
    chunks.push(entries.slice(start, start + MAX_SYNC_DELETE_BATCH_SIZE));
  return chunks;
}

function add_delete_outcome(
  summary: PushTableOutboxSummary,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
  outcome: PushOutcomeKindValue,
): PushTableOutboxSummary {
  return {
    ...summary,
    records_pushed:
      summary.records_pushed + (outcome === PushOutcomeKind.CONFIRMED ? 1 : 0),
    rejected:
      outcome === PushOutcomeKind.REJECTED
        ? [...summary.rejected, build_rejected_record(entry, result.action)]
        : summary.rejected,
  };
}

async function settle_delete_batch(
  command: PushTableOutboxCommand,
  chunk: SyncOutboxEntry[],
  response: DeleteBatchResponse,
): AsyncResult<PushTableOutboxSummary> {
  const entries_by_id = new Map(chunk.map((entry) => [entry.local_id, entry]));
  const remote_copies = new Map(
    response.conflicts.map((conflict) => [
      conflict.local_id,
      conflict.remote_data,
    ]),
  );
  let summary = create_empty_push_summary();
  for (const result of response.results) {
    const entry = entries_by_id.get(result.local_id);
    if (!entry) continue;
    const remote_copy = remote_copies.get(result.local_id);
    const outcome = await settle_delete_result(
      command,
      entry,
      result,
      remote_copy ? create_some_option(remote_copy) : create_none_option(),
    );
    if (!outcome.success) return log_delete_failure(command, entry, outcome);
    if (outcome.data === PushOutcomeKind.SUPERSEDED_BY_REMOTE)
      console.warn("[Sync:Push] Local delete lost to a newer remote update", {
        event: "sync_delete_superseded_by_remote_update",
        correlation_id: command.correlation_id,
        table_name: command.table_name,
        local_id: entry.local_id,
      });
    summary = add_delete_outcome(summary, entry, result, outcome.data);
  }
  return create_success_result(summary);
}

function log_delete_failure(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
  failure: { success: false; error: string },
): { success: false; error: string } {
  console.error("[Sync:Push] Delete result could not be settled", {
    event: "sync_delete_settle_failed",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    local_id: entry.local_id,
    error: failure.error,
  });
  return failure;
}

export async function push_outbox_deletes(
  command: PushTableOutboxCommand,
  entries: SyncOutboxEntry[],
): AsyncResult<PushTableOutboxSummary> {
  let summary = create_empty_push_summary();
  for (const chunk of chunk_entries(entries)) {
    const response = await send_sync_mutation<DeleteBatchResponse>(
      command,
      BATCH_DELETE_MUTATION_NAME,
      {
        table_name: command.table_name,
        records: chunk.map((entry) => ({
          local_id: entry.local_id,
          base_version: entry.base_version,
        })),
      },
    );
    if (!response.success) return response;
    const chunk_summary = await settle_delete_batch(
      command,
      chunk,
      response.data,
    );
    if (!chunk_summary.success) return chunk_summary;
    summary = merge_push_summaries(summary, chunk_summary.data);
  }
  return create_success_result(summary);
}
