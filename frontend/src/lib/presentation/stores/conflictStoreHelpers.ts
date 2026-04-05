import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";

export interface ConflictStoreState {
  pending_conflicts: ConflictRecord[];
  resolved_conflicts: Array<{
    conflict_id: string;
    table_name: string;
    local_id: string;
    action: ConflictResolutionAction;
    resolved_at: string;
    resolved_by: string | null;
    merged_data?: Record<string, unknown>;
  }>;
  is_resolution_in_progress: boolean;
  current_conflict_index: number;
  show_merge_screen: boolean;
}

export function get_resolved_data_for_action(
  conflict: ConflictRecord,
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
