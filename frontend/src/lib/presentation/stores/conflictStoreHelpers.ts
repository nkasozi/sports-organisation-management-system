import type {
  ConflictRecord,
  ConflictResolution,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

export interface ConflictStoreState {
  pending_conflicts: ScalarInput<ConflictRecord>[];
  resolved_conflicts: ScalarInput<ConflictResolution>[];
  is_resolution_in_progress: boolean;
  current_conflict_index: number;
  show_merge_screen: boolean;
}

export function get_resolved_data_for_action(
  conflict: ScalarInput<ConflictRecord>,
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
