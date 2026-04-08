import {
  build_sync_push_batches,
  type SyncBatchRecord,
} from "./syncPushBatching";
import type { ConflictFromServer, ConvexClient, TableName } from "./syncTypes";
import { EPOCH_TIMESTAMP } from "./syncTypes";

export async function push_table_to_convex(
  convex_client: ConvexClient,
  table_name: TableName,
  all_records: Array<{ id: string; updated_at?: string; created_at?: string }>,
  remote_latest_modified_at: string | null,
  detect_conflicts: boolean = true,
): Promise<{
  success: boolean;
  records_pushed: number;
  error: string | null;
  conflicts: ConflictFromServer[];
}> {
  const remote_cutoff = remote_latest_modified_at || EPOCH_TIMESTAMP;
  const server_is_empty = !remote_latest_modified_at;

  const push_log_context = server_is_empty
    ? `server is EMPTY, pushing all ${all_records.length} local records`
    : `${all_records.length} local records, server latest_modified_at: ${remote_cutoff}`;
  console.log(`[Sync:Push] ${table_name} — ${push_log_context}`);

  const records_to_push = server_is_empty
    ? all_records
    : all_records.filter((record) => {
        const record_modified_at =
          record.updated_at || record.created_at || EPOCH_TIMESTAMP;
        return record_modified_at > remote_cutoff;
      });

  if (records_to_push.length === 0) {
    console.log(
      `[Sync:Push] ${table_name} — no local records newer than server, nothing to push`,
    );
    return { success: true, records_pushed: 0, error: null, conflicts: [] };
  }

  console.log(
    `[Sync:Push] ${table_name} — ${records_to_push.length} records to push`,
  );

  let total_pushed = 0;
  const all_conflicts: ConflictFromServer[] = [];
  const sync_version = Date.now();
  const batch_records: SyncBatchRecord[] = records_to_push.map((record) => ({
    local_id: record.id,
    data: record as Record<string, unknown>,
    version: sync_version,
  }));
  const batch_partition_result = build_sync_push_batches({
    table_name,
    records: batch_records,
    detect_conflicts,
  });

  if (!batch_partition_result.success) {
    console.error("[Sync:Push] Batch partition failed", {
      event: "sync_push_batch_partition_failed",
      table_name,
      error: batch_partition_result.error,
    });
    return {
      success: false,
      records_pushed: 0,
      error: batch_partition_result.error,
      conflicts: [],
    };
  }

  try {
    for (
      let batch_index = 0;
      batch_index < batch_partition_result.batches.length;
      batch_index++
    ) {
      const batch = batch_partition_result.batches[batch_index];
      const batch_number = batch_index + 1;
      const total_batches = batch_partition_result.batches.length;
      console.log(
        `[Sync:Push] ${table_name} — sending batch ${batch_number}/${total_batches} (${batch.length} records)`,
      );

      const result = (await convex_client.mutation("sync:batch_upsert", {
        table_name,
        records: batch,
        detect_conflicts,
      })) as {
        success: boolean;
        error?: string;
        message?: string;
        results: Array<{ local_id: string; success: boolean; action: string }>;
        has_conflicts: boolean;
        conflicts: ConflictFromServer[];
      };

      if (!result.success) {
        const auth_error_message = result.error
          ? `${result.error}: ${result.message || "unknown"}`
          : `Server rejected batch (success=false, results: ${result.results?.length ?? 0})`;
        console.error(
          `[Sync:Push] ${table_name} — batch ${batch_number} REJECTED by server: ${auth_error_message}`,
        );
        return {
          success: false,
          records_pushed: total_pushed,
          error: auth_error_message,
          conflicts: all_conflicts,
        };
      }

      console.log(
        `[Sync:Push] ${table_name} — batch ${batch_number} result: success=${result.success}, actions: ${JSON.stringify(result.results.map((r) => r.action))}`,
      );

      if (result.has_conflicts && result.conflicts.length > 0) {
        console.warn(
          `[Sync:Push] ${table_name} — batch ${batch_number} has ${result.conflicts.length} conflicts`,
        );
        all_conflicts.push(...result.conflicts);
      }

      const non_conflict_count = result.results.filter(
        (r) => r.action !== "conflict_detected",
      ).length;
      total_pushed += non_conflict_count;
    }
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error("[Sync:Push] Operation failed", {
      event: "sync_push_operation_failed",
      context: String(table_name),
      error: String(error_message),
    });
    return {
      success: false,
      records_pushed: total_pushed,
      error: error_message,
      conflicts: all_conflicts,
    };
  }

  console.log(
    `[Sync:Push] ${table_name} — completed, pushed ${total_pushed} records`,
  );
  return {
    success: true,
    records_pushed: total_pushed,
    error: null,
    conflicts: all_conflicts,
  };
}
