import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  type ConflictRecord,
  type ConflictResolution,
  type ConflictResolutionAction,
  ConflictResolutionActionKind,
} from "$lib/infrastructure/sync/conflictTypes";

export interface ConflictStoreState {
  pending_conflicts: ScalarInput<ConflictRecord>[];
  resolved_conflicts: ScalarInput<ConflictResolution>[];
  is_resolution_in_progress: boolean;
  current_conflict_index: number;
  show_merge_screen: boolean;
}

export const CurrentConflictStatus = {
  ABSENT: "absent",
  PRESENT: "present",
} as const;

export type CurrentConflictState =
  | { status: typeof CurrentConflictStatus.ABSENT }
  | {
      status: typeof CurrentConflictStatus.PRESENT;
      conflict: ScalarInput<ConflictRecord>;
    };

export function create_current_conflict_state(
  pending_conflicts: ScalarInput<ConflictRecord>[],
  current_conflict_index: number,
): CurrentConflictState {
  const current_conflict = pending_conflicts[current_conflict_index];

  return current_conflict
    ? { status: CurrentConflictStatus.PRESENT, conflict: current_conflict }
    : { status: CurrentConflictStatus.ABSENT };
}

export function get_resolved_data_for_action(
  conflict: ScalarInput<ConflictRecord>,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): Record<string, unknown> {
  switch (action) {
    case ConflictResolutionActionKind.KEEP_LOCAL:
      return { ...conflict.local_data, updated_at: new Date().toISOString() };
    case ConflictResolutionActionKind.KEEP_REMOTE:
      return conflict.remote_data;
    case ConflictResolutionActionKind.MERGE:
      return merged_data || conflict.local_data;
  }
}
