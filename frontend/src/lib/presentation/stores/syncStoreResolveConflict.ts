import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { Result } from "$lib/core/types/Result";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import type { ConflictResolutionRequest } from "$lib/infrastructure/sync/convexSyncService";
import { resolve_conflict } from "$lib/infrastructure/sync/convexSyncService";

type ConvexClient = {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
};

type EditableConflictRecord = ScalarInput<ConflictRecord>;
type ConflictResolutionExecutionResult =
  | { success: true }
  | { success: false; error: string };

function build_resolved_data(
  conflict: EditableConflictRecord,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): Record<string, unknown> {
  switch (action) {
    case "keep_local":
      return { ...conflict.local_data, updated_at: new Date().toISOString() };
    case "keep_remote":
      return conflict.remote_data;
    case "merge":
      return merged_data || conflict.local_data;
    default:
      return conflict.local_data;
  }
}

export async function execute_conflict_resolution(
  convex_client_result: Result<ConvexClient>,
  conflict: EditableConflictRecord,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): Promise<ConflictResolutionExecutionResult> {
  if (!convex_client_result.success) {
    return { success: false, error: convex_client_result.error };
  }

  const resolved_data = build_resolved_data(conflict, action, merged_data);

  const request: ConflictResolutionRequest = {
    table_name: conflict.table_name,
    local_id: conflict.local_id,
    resolved_data,
    resolution_action: action,
  };

  const result = await resolve_conflict(convex_client_result.data, request);

  return result.success
    ? { success: true }
    : { success: false, error: result.error };
}
