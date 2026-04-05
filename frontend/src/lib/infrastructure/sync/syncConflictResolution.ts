import type {
  ConvexClient,
  ConflictResolutionRequest,
  TableName,
} from "./syncTypes";
import { get_table_from_database, get_database } from "./syncDataAccess";

export async function resolve_conflict(
  convex_client: ConvexClient,
  request: ConflictResolutionRequest,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const new_version = Date.now();

    await convex_client.mutation("sync:force_resolve_conflict", {
      table_name: request.table_name,
      local_id: request.local_id,
      resolved_data: request.resolved_data,
      new_version,
      resolution_action: request.resolution_action,
      resolved_by: request.resolved_by || null,
    });

    const database = get_database();
    const table = get_table_from_database(
      database,
      request.table_name as TableName,
    );

    if (table) {
      const updated_record = {
        ...request.resolved_data,
        id: request.local_id,
        updated_at: new Date().toISOString(),
      } as { id: string };
      await table.put(updated_record);
    }

    return { success: true, error: null };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error(`[Sync] Conflict resolution failed:`, error_message);
    return { success: false, error: error_message };
  }
}

export async function resolve_multiple_conflicts(
  convex_client: ConvexClient,
  requests: ConflictResolutionRequest[],
): Promise<{
  success: boolean;
  resolved_count: number;
  failed_count: number;
  errors: Array<{ local_id: string; error: string }>;
}> {
  const errors: Array<{ local_id: string; error: string }> = [];
  let resolved_count = 0;

  for (const request of requests) {
    const result = await resolve_conflict(convex_client, request);
    if (result.success) {
      resolved_count++;
    } else {
      errors.push({
        local_id: request.local_id,
        error: result.error || "Unknown error",
      });
    }
  }

  return {
    success: errors.length === 0,
    resolved_count,
    failed_count: errors.length,
    errors,
  };
}
