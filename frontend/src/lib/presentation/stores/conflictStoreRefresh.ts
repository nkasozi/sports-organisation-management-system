import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  compute_field_differences,
  type ConflictRecord,
} from "$lib/infrastructure/sync/conflictTypes";
import { is_string_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

import type { ConflictStoreContext } from "./conflictStoreActions";

function refresh_remote_copy(
  conflict: ScalarInput<ConflictRecord>,
  remote_data: Record<string, unknown>,
  remote_version: number,
): ScalarInput<ConflictRecord> {
  return {
    ...conflict,
    remote_data,
    remote_version,
    remote_updated_at: is_string_value(remote_data.updated_at)
      ? (remote_data.updated_at as ConflictRecord["remote_updated_at"])
      : conflict.remote_updated_at,
    field_differences: compute_field_differences(
      conflict.local_data,
      remote_data,
    ),
  };
}

export function refresh_conflict_remote_copy(
  context: ConflictStoreContext,
  conflict_id: string,
  remote_data: Record<string, unknown>,
  remote_version: number,
): boolean {
  const exists = context
    .read_state()
    .pending_conflicts.some((conflict) => conflict.id === conflict_id);
  if (!exists) return false;
  context.update((state) => ({
    ...state,
    pending_conflicts: state.pending_conflicts.map((conflict) =>
      conflict.id === conflict_id
        ? refresh_remote_copy(conflict, remote_data, remote_version)
        : conflict,
    ),
  }));
  return true;
}

export function remove_conflict(
  context: ConflictStoreContext,
  conflict_id: string,
): boolean {
  const exists = context
    .read_state()
    .pending_conflicts.some((conflict) => conflict.id === conflict_id);
  if (!exists) return false;
  context.update((state) => ({
    ...state,
    pending_conflicts: state.pending_conflicts.filter(
      (conflict) => conflict.id !== conflict_id,
    ),
  }));
  return true;
}
