import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import { collect_hidden_conflict_ids } from "./syncConflictVisibility";
import {
  DELETE_REVIEW_PARKING,
  HIDDEN_DELETE_REVIEW_PARKING,
  is_delete_conflict,
  park_change_for_review,
} from "./syncPushDeleteReview";
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
  conflicts: unknown;
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

async function settle_one_delete(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
  hidden_conflict_ids: ReadonlySet<string>,
): Promise<PushTableOutboxSummary> {
  const summary = create_empty_push_summary();
  if (is_delete_conflict(result))
    return {
      ...summary,
      rejected: await park_change_for_review(
        command,
        entry,
        result,
        hidden_conflict_ids.has(entry.local_id)
          ? HIDDEN_DELETE_REVIEW_PARKING
          : DELETE_REVIEW_PARKING,
      ),
    };
  const outcome = await settle_delete_result(command, entry, result);
  return add_delete_outcome(summary, entry, result, outcome);
}

async function settle_delete_batch(
  command: PushTableOutboxCommand,
  chunk: SyncOutboxEntry[],
  response: DeleteBatchResponse,
): Promise<PushTableOutboxSummary> {
  const entries_by_id = new Map(chunk.map((entry) => [entry.local_id, entry]));
  const hidden_conflict_ids = collect_hidden_conflict_ids(response.conflicts);
  let summary = create_empty_push_summary();
  for (const result of response.results) {
    const entry = entries_by_id.get(result.local_id);
    if (!entry) continue;
    summary = merge_push_summaries(
      summary,
      await settle_one_delete(command, entry, result, hidden_conflict_ids),
    );
  }
  return summary;
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
    summary = merge_push_summaries(
      summary,
      await settle_delete_batch(command, chunk, response.data),
    );
  }
  return create_success_result(summary);
}
