import {
  INITIAL_SYNC_CURSOR_SEQUENCE,
  SYNC_CURSORS_TABLE_NAME,
  SyncBaseVersionKind,
  type SyncOutboxEntry,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import type { ServerRecordResult } from "./syncPushOutcomes";
import type { PushTableOutboxCommand } from "./syncPushTransport";

const SKIPPED_ACTION = "skipped";

function is_based_on_server_version(
  entry: SyncOutboxEntry,
  server_version: number,
): boolean {
  switch (entry.base_version.kind) {
    case SyncBaseVersionKind.KNOWN:
      return entry.base_version.version === server_version;
    case SyncBaseVersionKind.UNKNOWN:
    case SyncBaseVersionKind.RECREATE:
      return false;
  }
}

export function skipped_upsert_hides_server_changes(
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
): boolean {
  return (
    result.success &&
    result.action === SKIPPED_ACTION &&
    !is_based_on_server_version(entry, result.server_version)
  );
}

export async function request_table_repull(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
): Promise<boolean> {
  await command.database.table(SYNC_CURSORS_TABLE_NAME).put({
    table_name: command.table_name,
    after_sequence: INITIAL_SYNC_CURSOR_SEQUENCE,
  });
  console.warn("[Sync:Push] Server copy is newer than the skipped change", {
    event: "sync_push_skipped_change_requires_repull",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    local_id: entry.local_id,
  });
  return true;
}
