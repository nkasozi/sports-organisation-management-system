import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import { collect_hidden_conflict_ids } from "./syncConflictVisibility";
import { refresh_record_deferred_during_push } from "./syncPushDeferredRefresh";
import {
  HIDDEN_UPSERT_REVIEW_PARKING,
  is_delete_conflict,
  park_change_for_review,
} from "./syncPushDeleteReview";
import {
  build_rejected_record,
  PushOutcomeKind,
  type PushOutcomeKindValue,
  type ServerRecordResult,
  settle_upsert_result,
} from "./syncPushOutcomes";
import type { LoadedOutboxRecord } from "./syncPushRecordLoading";
import {
  request_table_repull,
  skipped_upsert_hides_server_changes,
} from "./syncPushSkippedUpserts";
import type {
  DeletedRemotelyRecord,
  PushTableOutboxCommand,
  PushTableOutboxSummary,
} from "./syncPushTransport";
import {
  normalize_conflict_from_server,
  type RawConflictFromServer,
} from "./syncTypes";

interface ServerDeletedRemotely {
  local_id: string;
  tombstone_version: number;
  deleted_at: string;
}

export interface UpsertBatchResponse {
  results: ServerRecordResult[];
  conflicts: RawConflictFromServer[];
  deleted_remotely: ServerDeletedRemotely[];
}

function build_deleted_remotely_record(
  loaded: LoadedOutboxRecord,
  deletion: ServerDeletedRemotely,
): DeletedRemotelyRecord {
  return {
    table_name: loaded.entry.table_name,
    local_id: loaded.entry.local_id,
    local_data: loaded.record,
    tombstone_version: deletion.tombstone_version,
    deleted_at: deletion.deleted_at,
  };
}

function add_upsert_outcome(
  summary: PushTableOutboxSummary,
  loaded: LoadedOutboxRecord,
  result: ServerRecordResult,
  outcome: PushOutcomeKindValue,
  deletions: Map<string, ServerDeletedRemotely>,
): PushTableOutboxSummary {
  const deletion = deletions.get(loaded.entry.local_id);
  return {
    ...summary,
    records_pushed:
      summary.records_pushed + (outcome === PushOutcomeKind.CONFIRMED ? 1 : 0),
    rejected:
      outcome === PushOutcomeKind.REJECTED
        ? [
            ...summary.rejected,
            build_rejected_record(loaded.entry, result.action),
          ]
        : summary.rejected,
    deleted_remotely:
      outcome === PushOutcomeKind.DELETED_REMOTELY && deletion
        ? [
            ...summary.deleted_remotely,
            build_deleted_remotely_record(loaded, deletion),
          ]
        : summary.deleted_remotely,
  };
}

function log_deleted_remotely(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
): boolean {
  console.warn("[Sync:Push] Local change targets a record deleted remotely", {
    event: "sync_push_record_deleted_remotely",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    local_id: entry.local_id,
  });
  return true;
}

async function follow_up_confirmed_upsert(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
): Promise<boolean> {
  if (skipped_upsert_hides_server_changes(entry, result))
    return request_table_repull(command, entry);
  return refresh_record_deferred_during_push(command, entry, result);
}

interface UpsertSettlementContext {
  command: PushTableOutboxCommand;
  deletions: Map<string, ServerDeletedRemotely>;
  hidden_conflict_ids: ReadonlySet<string>;
}

function is_hidden_conflict_result(
  context: UpsertSettlementContext,
  result: ServerRecordResult,
): boolean {
  return (
    is_delete_conflict(result) &&
    context.hidden_conflict_ids.has(result.local_id)
  );
}

async function settle_one_upsert(
  context: UpsertSettlementContext,
  loaded: LoadedOutboxRecord,
  result: ServerRecordResult,
  summary: PushTableOutboxSummary,
): Promise<PushTableOutboxSummary> {
  const { command } = context;
  if (is_hidden_conflict_result(context, result))
    return {
      ...summary,
      rejected: [
        ...summary.rejected,
        ...(await park_change_for_review(
          command,
          loaded.entry,
          result,
          HIDDEN_UPSERT_REVIEW_PARKING,
        )),
      ],
    };
  const outcome = await settle_upsert_result(command, loaded.entry, result);
  if (outcome === PushOutcomeKind.CONFIRMED)
    await follow_up_confirmed_upsert(command, loaded.entry, result);
  if (outcome === PushOutcomeKind.DELETED_REMOTELY)
    log_deleted_remotely(command, loaded.entry);
  return add_upsert_outcome(
    summary,
    loaded,
    result,
    outcome,
    context.deletions,
  );
}

export async function settle_upsert_batch_response(
  command: PushTableOutboxCommand,
  loaded_by_id: Map<string, LoadedOutboxRecord>,
  response: UpsertBatchResponse,
  summary: PushTableOutboxSummary,
): Promise<PushTableOutboxSummary> {
  const context: UpsertSettlementContext = {
    command,
    deletions: new Map(
      response.deleted_remotely.map((deletion) => [
        deletion.local_id,
        deletion,
      ]),
    ),
    hidden_conflict_ids: collect_hidden_conflict_ids(response.conflicts),
  };
  let next_summary: PushTableOutboxSummary = {
    ...summary,
    conflicts: [
      ...summary.conflicts,
      ...response.conflicts
        .filter(
          (conflict) => !context.hidden_conflict_ids.has(conflict.local_id),
        )
        .map(normalize_conflict_from_server),
    ],
  };
  for (const result of response.results) {
    const loaded = loaded_by_id.get(result.local_id);
    if (!loaded) continue;
    next_summary = await settle_one_upsert(
      context,
      loaded,
      result,
      next_summary,
    );
  }
  return next_summary;
}
