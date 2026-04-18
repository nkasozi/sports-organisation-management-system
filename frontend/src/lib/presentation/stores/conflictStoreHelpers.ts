import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type {
  ConflictRecord,
  ConflictResolution,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";

export interface ConflictStoreState {
  pending_conflicts: ScalarInput<ConflictRecord>[];
  resolved_conflicts: ScalarInput<ConflictResolution>[];
  is_resolution_in_progress: boolean;
  current_conflict_index: number;
  show_merge_screen: boolean;
}

export type CurrentConflictState =
  | { status: "absent" }
  | { status: "present"; conflict: ScalarInput<ConflictRecord> };

export function create_current_conflict_state(
  pending_conflicts: ScalarInput<ConflictRecord>[],
  current_conflict_index: number,
): CurrentConflictState {
  const current_conflict = pending_conflicts[current_conflict_index];

  return current_conflict
    ? { status: "present", conflict: current_conflict }
    : { status: "absent" };
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
