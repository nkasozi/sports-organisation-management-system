import type { Table } from "dexie";

import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { set_pulling_from_remote } from "./syncState";
import type { ConvexClient, ConvexRecord, TableName } from "./syncTypes";
import { EPOCH_TIMESTAMP } from "./syncTypes";

type SyncPullQueryResult =
  | ConvexRecord[]
  | { success: true; data: ConvexRecord[] }
  | { success: false; data: ConvexRecord[]; error: string };

function is_sync_pull_query_result_object(
  sync_result: unknown,
): sync_result is Exclude<SyncPullQueryResult, ConvexRecord[]> {
  return (
    typeof sync_result === "object" &&
    sync_result != void 0 &&
    !Array.isArray(sync_result) &&
    "success" in sync_result &&
    "data" in sync_result
  );
}

export async function pull_table_from_convex(
  convex_client: ConvexClient,
  table: Table<
    { id: string; updated_at?: string; created_at?: string },
    string
  >,
  table_name: TableName,
  local_latest_modified_at: string,
): AsyncResult<{ records_pulled: number }> {
  try {
    console.log(
      `[Sync:Pull] ${table_name} — querying Convex for changes since local latest: ${local_latest_modified_at}`,
    );

    const sync_result = (await convex_client.query("sync:get_changes_since", {
      table_name,
      since_timestamp: local_latest_modified_at,
    })) as SyncPullQueryResult | unknown;

    if (sync_result == void 0) {
      return create_failure_result("Invalid sync response");
    }

    const is_result_type = is_sync_pull_query_result_object(sync_result);
    const remote_changes: ConvexRecord[] = is_result_type
      ? sync_result.data
      : (sync_result as ConvexRecord[]);

    if (is_result_type && !sync_result.success) {
      console.warn(
        `[Sync:Pull] ${table_name} — server returned error: ${sync_result.error}`,
      );
      return create_failure_result(sync_result.error);
    }

    if (remote_changes.length === 0) {
      console.log(`[Sync:Pull] ${table_name} — no remote changes found`);
      return create_success_result({ records_pulled: 0 });
    }

    console.log(
      `[Sync:Pull] ${table_name} — found ${remote_changes.length} remote changes to process`,
    );
    let records_pulled = 0;
    let records_skipped = 0;

    set_pulling_from_remote(true);

    try {
      for (const remote_record of remote_changes) {
        const local_id = remote_record.local_id;
        const existing_local = await table.get(local_id);

        const local_data = { ...remote_record } as Record<string, unknown>;
        delete local_data._id;
        delete local_data._creationTime;
        delete local_data.local_id;
        delete local_data.synced_at;
        delete local_data.version;
        local_data.id = local_id;

        if (!existing_local) {
          await table.put(local_data as unknown as { id: string });
          records_pulled++;
          continue;
        }

        const local_timestamp =
          existing_local.updated_at ||
          existing_local.created_at ||
          EPOCH_TIMESTAMP;
        const remote_timestamp =
          ((remote_record as Record<string, unknown>).updated_at as string) ||
          remote_record.synced_at ||
          EPOCH_TIMESTAMP;

        if (remote_timestamp <= local_timestamp) {
          records_skipped++;
          continue;
        }

        await table.put(local_data as unknown as { id: string });
        records_pulled++;
      }
    } finally {
      set_pulling_from_remote(false);
    }

    console.log(
      `[Sync:Pull] ${table_name} — completed: pulled ${records_pulled}, skipped ${records_skipped} (local was newer)`,
    );
    return create_success_result({ records_pulled });
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error("[Sync:Pull] Operation failed", {
      event: "failed_failed",
      context: String(table_name),
      error: String(error_message),
    });

    return create_failure_result(error_message);
  }
}
