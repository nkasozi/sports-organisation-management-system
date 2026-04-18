import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { get_database, get_table_from_database } from "./syncDataAccess";
import type {
  ConflictResolutionRequest,
  ConvexClient,
  TableName,
} from "./syncTypes";

export async function resolve_conflict(
  convex_client: ConvexClient,
  request: ConflictResolutionRequest,
): AsyncResult<boolean> {
  try {
    const new_version = Date.now();
    const mutation_args: Record<string, unknown> = {
      table_name: request.table_name,
      local_id: request.local_id,
      resolved_data: request.resolved_data,
      new_version,
      resolution_action: request.resolution_action,
    };

    if (request.resolved_by) {
      mutation_args["resolved_by"] = request.resolved_by;
    }

    await convex_client.mutation("sync:force_resolve_conflict", mutation_args);

    const database = get_database();
    const table = get_table_from_database(
      database,
      request.table_name as TableName,
    );

    const updated_record = {
      ...request.resolved_data,
      id: request.local_id,
      updated_at: new Date().toISOString(),
    } as { id: string };
    await table.put(updated_record);

    return create_success_result(true);
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error("[Sync] Conflict resolution failed", {
      event: "sync_conflict_resolution_failed",
      error: String(error_message),
    });

    return create_failure_result(error_message);
  }
}

async function resolve_multiple_conflicts(
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
