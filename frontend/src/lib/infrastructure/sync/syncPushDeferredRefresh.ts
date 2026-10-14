import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";
import { is_record_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

import { sync_deferred_remote_changes } from "./syncDeferredRemoteChanges";
import {
  load_server_copy,
  type ServerCopy,
  ServerCopyStatus,
} from "./syncOutboxReviewServerCopy";
import type { ServerRecordResult } from "./syncPushOutcomes";
import { request_table_repull } from "./syncPushSkippedUpserts";
import type { PushTableOutboxCommand } from "./syncPushTransport";
import { convert_server_record_to_remote_change } from "./syncRemoteApply";
import {
  apply_resolved_remote_record,
  ResolvedRecordGuardKind,
} from "./syncRemoteApplyRecords";

function read_returned_record(
  result: ServerRecordResult,
): Option<Record<string, unknown>> {
  const returned_record = (result as unknown as Record<string, unknown>).record;
  return is_record_value(returned_record)
    ? create_some_option(returned_record)
    : create_none_option();
}

async function resolve_server_copy(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
): AsyncResult<ServerCopy> {
  const returned = read_returned_record(result);
  return returned.status === OptionStatus.SOME
    ? create_success_result({
        status: ServerCopyStatus.FOUND,
        record: returned.value,
      })
    : load_server_copy(command, entry.table_name, entry.local_id);
}

async function apply_server_copy(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
  record: Record<string, unknown>,
): Promise<boolean> {
  await apply_resolved_remote_record(
    command,
    entry.table_name,
    convert_server_record_to_remote_change({
      ...record,
      local_id: entry.local_id,
    }),
    {
      kind: ResolvedRecordGuardKind.CHANGE_TOKEN,
      change_token: entry.change_token,
    },
  );
  console.log("[Sync:Push] Applied the server copy a realtime pull skipped", {
    event: "sync_push_deferred_server_copy_applied",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    local_id: entry.local_id,
  });
  return true;
}

export async function refresh_record_deferred_during_push(
  command: PushTableOutboxCommand,
  entry: SyncOutboxEntry,
  result: ServerRecordResult,
): Promise<boolean> {
  if (!sync_deferred_remote_changes.take(command.table_name, entry.local_id))
    return false;
  const server_copy = await resolve_server_copy(command, entry, result);
  if (!server_copy.success) return request_table_repull(command, entry);
  switch (server_copy.data.status) {
    case ServerCopyStatus.FOUND:
      return apply_server_copy(command, entry, server_copy.data.record);
    case ServerCopyStatus.NOT_FOUND:
      return false;
  }
}
