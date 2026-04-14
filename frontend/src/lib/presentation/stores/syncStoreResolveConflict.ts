import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import type { ConflictResolutionRequest } from "$lib/infrastructure/sync/convexSyncService";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import { resolve_conflict } from "$lib/infrastructure/sync/convexSyncService";

type ConvexClient = {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
};

type EditableConflictRecord = ScalarInput<ConflictRecord>;

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
  convex_client: ConvexClient | null,
  conflict: EditableConflictRecord,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): Promise<{ success: boolean; error: string | null }> {
  if (!convex_client) {
    return { success: false, error: "Convex client not configured" };
  }

  const resolved_data = build_resolved_data(conflict, action, merged_data);

  const request: ConflictResolutionRequest = {
    table_name: conflict.table_name,
    local_id: conflict.local_id,
    resolved_data,
    resolution_action: action,
  };

  return resolve_conflict(convex_client, request);
}
