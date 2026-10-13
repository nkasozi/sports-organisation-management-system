import {
  type SyncBaseVersion,
  SyncBaseVersionKind,
  type SyncOutboxEntry,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  build_sync_push_batches,
  type SyncBatchRecord,
} from "./syncPushBatching";
import { reject_oversized_records } from "./syncPushOversized";
import {
  load_outbox_records,
  type LoadedOutboxRecord,
} from "./syncPushRecordLoading";
import {
  create_empty_push_summary,
  type PushTableOutboxCommand,
  type PushTableOutboxSummary,
  send_sync_mutation,
} from "./syncPushTransport";
import {
  settle_upsert_batch_response,
  type UpsertBatchResponse,
} from "./syncPushUpsertSettlement";

const BATCH_UPSERT_MUTATION_NAME = "sync:batch_upsert";
const LEGACY_VERSION_PLACEHOLDER = 0;
const MISSING_DELETED_REMOTELY_ERROR =
  "Server upsert response is missing the deleted_remotely list";

interface VersionedSyncBatchRecord extends SyncBatchRecord {
  base_version: SyncBaseVersion;
}

function build_batch_record(
  loaded: LoadedOutboxRecord,
): VersionedSyncBatchRecord {
  const base_version = loaded.entry.base_version;
  return {
    local_id: loaded.entry.local_id,
    data: loaded.record,
    version:
      base_version.kind === SyncBaseVersionKind.KNOWN
        ? base_version.version
        : LEGACY_VERSION_PLACEHOLDER,
    base_version,
  };
}

async function send_upsert_batches(
  command: PushTableOutboxCommand,
  loaded_by_id: Map<string, LoadedOutboxRecord>,
  batches: VersionedSyncBatchRecord[][],
  initial_summary: PushTableOutboxSummary,
): AsyncResult<PushTableOutboxSummary> {
  let summary = initial_summary;
  for (const batch of batches) {
    const response = await send_sync_mutation<UpsertBatchResponse>(
      command,
      BATCH_UPSERT_MUTATION_NAME,
      {
        table_name: command.table_name,
        records: batch,
        detect_conflicts: command.detect_conflicts,
      },
    );
    if (!response.success) return response;
    if (!Array.isArray(response.data.deleted_remotely))
      return create_failure_result(MISSING_DELETED_REMOTELY_ERROR);
    summary = await settle_upsert_batch_response(
      command,
      loaded_by_id,
      response.data,
      summary,
    );
  }
  return create_success_result(summary);
}

export async function push_outbox_upserts(
  command: PushTableOutboxCommand,
  entries: SyncOutboxEntry[],
): AsyncResult<PushTableOutboxSummary> {
  if (entries.length === 0)
    return create_success_result(create_empty_push_summary());
  const loaded = await load_outbox_records(command, entries);
  if (!loaded.success) return loaded;
  const sendable = await reject_oversized_records(command, loaded.data);
  const batches = build_sync_push_batches({
    table_name: command.table_name,
    records: sendable.records.map(build_batch_record),
    detect_conflicts: command.detect_conflicts,
  });
  if (!batches.success) return batches;
  return send_upsert_batches(
    command,
    new Map(sendable.records.map((item) => [item.entry.local_id, item])),
    batches.data,
    sendable.summary,
  );
}
