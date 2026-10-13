import { build_sync_outbox_key } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { outbox_table } from "./syncOutboxRepository";
import {
  convert_server_record_to_remote_change,
  type RemoteApplyDependencies,
  run_remote_apply_transaction,
} from "./syncRemoteApply";
import {
  apply_resolved_remote_record,
  ResolvedRecordGuardKind,
} from "./syncRemoteApplyRecords";
import type { ConvexClient } from "./syncTypes";

const RECORD_LOOKUP_QUERY_NAME = "sync:get_record_by_local_id";
const SERVER_COPY_UNAVAILABLE_ERROR =
  "We couldn't load the saved copy from the server. Check your connection and try again.";

const ServerCopyStatus = {
  FOUND: "found",
  NOT_FOUND: "not_found",
} as const;

type ServerCopy =
  | { status: typeof ServerCopyStatus.FOUND; record: Record<string, unknown> }
  | { status: typeof ServerCopyStatus.NOT_FOUND };

interface DiscardRejectedDependencies extends RemoteApplyDependencies {
  convex_client: ConvexClient;
}

function parse_server_copy(response: unknown): Result<ServerCopy> {
  if (!(response instanceof Object))
    return create_failure_result(SERVER_COPY_UNAVAILABLE_ERROR);
  const lookup = response as { status?: unknown; record?: unknown };
  switch (lookup.status) {
    case ServerCopyStatus.FOUND:
      return lookup.record instanceof Object
        ? create_success_result({
            status: ServerCopyStatus.FOUND,
            record: lookup.record as Record<string, unknown>,
          })
        : create_failure_result(SERVER_COPY_UNAVAILABLE_ERROR);
    case ServerCopyStatus.NOT_FOUND:
      return create_success_result({ status: ServerCopyStatus.NOT_FOUND });
    default:
      return create_failure_result(SERVER_COPY_UNAVAILABLE_ERROR);
  }
}

async function load_server_copy(
  dependencies: DiscardRejectedDependencies,
  table_name: string,
  local_id: string,
): AsyncResult<ServerCopy> {
  try {
    return parse_server_copy(
      await dependencies.convex_client.query(RECORD_LOOKUP_QUERY_NAME, {
        table_name,
        local_id,
      }),
    );
  } catch (error) {
    console.error("[Sync:Review] Server copy lookup failed", {
      event: "sync_review_server_copy_lookup_failed",
      table_name,
      local_id,
      error: String(error),
    });
    return create_failure_result(SERVER_COPY_UNAVAILABLE_ERROR);
  }
}

async function remove_never_synced_record(
  dependencies: RemoteApplyDependencies,
  table_name: string,
  local_id: string,
): Promise<boolean> {
  return run_remote_apply_transaction(
    dependencies,
    table_name,
    async (tables) => {
      const key = build_sync_outbox_key(table_name, local_id);
      await tables.data.delete(local_id);
      await tables.versions.delete(key);
      await tables.outbox.delete(key);
      return true;
    },
  );
}

export async function discard_rejected_change(
  dependencies: DiscardRejectedDependencies,
  table_name: string,
  local_id: string,
): AsyncResult<boolean> {
  const server_copy = await load_server_copy(
    dependencies,
    table_name,
    local_id,
  );
  if (!server_copy.success) return server_copy;
  if (server_copy.data.status === ServerCopyStatus.NOT_FOUND)
    return create_success_result(
      await remove_never_synced_record(dependencies, table_name, local_id),
    );
  const entry = await outbox_table(dependencies.database).get(
    build_sync_outbox_key(table_name, local_id),
  );
  await apply_resolved_remote_record(
    dependencies,
    table_name,
    convert_server_record_to_remote_change({
      ...server_copy.data.record,
      local_id,
    }),
    entry
      ? {
          kind: ResolvedRecordGuardKind.CHANGE_TOKEN,
          change_token: entry.change_token,
        }
      : { kind: ResolvedRecordGuardKind.CONFLICTED_ENTRY },
  );
  console.log("[Sync:Review] Rejected change discarded for the server copy", {
    event: "sync_review_rejected_change_discarded",
    table_name,
    local_id,
  });
  return create_success_result(true);
}
