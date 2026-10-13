import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import {
  build_rejected_record,
  PushOutcomeKind,
  type PushOutcomeKindValue,
  type ServerRecordResult,
  settle_upsert_result,
} from "./syncPushOutcomes";
import type { LoadedOutboxRecord } from "./syncPushRecordLoading";
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

export async function settle_upsert_batch_response(
  command: PushTableOutboxCommand,
  loaded_by_id: Map<string, LoadedOutboxRecord>,
  response: UpsertBatchResponse,
  summary: PushTableOutboxSummary,
): Promise<PushTableOutboxSummary> {
  const deletions = new Map(
    response.deleted_remotely.map((deletion) => [deletion.local_id, deletion]),
  );
  let next_summary: PushTableOutboxSummary = {
    ...summary,
    conflicts: [
      ...summary.conflicts,
      ...response.conflicts.map(normalize_conflict_from_server),
    ],
  };
  for (const result of response.results) {
    const loaded = loaded_by_id.get(result.local_id);
    if (!loaded) continue;
    const outcome = await settle_upsert_result(command, loaded.entry, result);
    if (outcome === PushOutcomeKind.DELETED_REMOTELY)
      log_deleted_remotely(command, loaded.entry);
    next_summary = add_upsert_outcome(
      next_summary,
      loaded,
      result,
      outcome,
      deletions,
    );
  }
  return next_summary;
}
