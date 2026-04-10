import { get, writable } from "svelte/store";

import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  log_conflict_detected,
  log_conflict_resolution,
} from "$lib/infrastructure/sync/conflictAuditService";
import type {
  ConflictRecord,
  ConflictResolution,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import {
  compute_field_differences,
  generate_conflict_id,
  get_entity_display_name,
} from "$lib/infrastructure/sync/conflictTypes";

import type { ConflictStoreState } from "./conflictStoreHelpers";
import { get_resolved_data_for_action } from "./conflictStoreHelpers";
const INITIAL_STATE: ConflictStoreState = {
  pending_conflicts: [],
  resolved_conflicts: [],
  is_resolution_in_progress: false,
  current_conflict_index: 0,
  show_merge_screen: false,
};

function create_conflict_store() {
  const { subscribe, set, update } =
    writable<ConflictStoreState>(INITIAL_STATE);

  function add_conflicts_from_sync_response(
    table_name: string,
    conflicts: Array<{
      local_id: string;
      local_data: Record<string, unknown>;
      local_version: number;
      remote_data: Record<string, unknown>;
      remote_version: number;
      remote_updated_at: string;
      remote_updated_by: string | null;
    }>,
  ): boolean {
    if (conflicts.length === 0) return false;

    const new_conflicts: ConflictRecord[] = conflicts.map((conflict) => ({
      id: generate_conflict_id(table_name, conflict.local_id),
      table_name,
      local_id: conflict.local_id,
      entity_display_name: get_entity_display_name(
        conflict.local_data,
        table_name,
      ),
      local_data: conflict.local_data,
      remote_data: conflict.remote_data,
      local_updated_at:
        (conflict.local_data.updated_at as string) || new Date().toISOString(),
      remote_updated_at: conflict.remote_updated_at,
      remote_updated_by: conflict.remote_updated_by,
      remote_updated_by_name: null,
      field_differences: compute_field_differences(
        conflict.local_data,
        conflict.remote_data,
      ),
      detected_at: new Date().toISOString(),
    }));

    for (const conflict of new_conflicts) {
      log_conflict_detected(conflict).catch((err) => {
        console.error("[ConflictStore] Failed to audit log conflict", {
          event: "conflict_audit_log_failed",
          error: String(err),
        });
      });
    }

    update((state) => ({
      ...state,
      pending_conflicts: [...state.pending_conflicts, ...new_conflicts],
      show_merge_screen: true,
    }));
    return true;
  }

  function resolve_conflict(
    conflict_id: string,
    action: ConflictResolutionAction,
    merged_data?: Record<string, unknown>,
  ): Result<ConflictResolution> {
    const current_state = get({ subscribe });
    const conflict = current_state.pending_conflicts.find(
      (c) => c.id === conflict_id,
    );
    if (!conflict)
      return create_failure_result(`Conflict not found: ${conflict_id}`);

    const resolution: ConflictResolution = {
      conflict_id,
      table_name: conflict.table_name,
      local_id: conflict.local_id,
      action,
      resolved_at: new Date().toISOString(),
      resolved_by: null,
      merged_data,
    };

    const resolved_data = get_resolved_data_for_action(
      conflict,
      action,
      merged_data,
    );
    log_conflict_resolution(conflict, action, resolved_data).catch((err) => {
      console.error("[ConflictStore] Failed to audit log conflict resolution", {
        event: "conflict_resolution_audit_log_failed",
        error: String(err),
      });
    });

    update((state) => ({
      ...state,
      pending_conflicts: state.pending_conflicts.filter(
        (c) => c.id !== conflict_id,
      ),
      resolved_conflicts: [...state.resolved_conflicts, resolution],
    }));
    return create_success_result(resolution);
  }

  function resolve_current_conflict(
    action: ConflictResolutionAction,
    merged_data?: Record<string, unknown>,
  ): Result<ConflictResolution> {
    const current_state = get({ subscribe });
    const current_conflict =
      current_state.pending_conflicts[current_state.current_conflict_index];
    if (!current_conflict)
      return create_failure_result("No current conflict to resolve");
    return resolve_conflict(current_conflict.id, action, merged_data);
  }

  function move_to_next_conflict(): boolean {
    const current_state = get({ subscribe });
    if (
      current_state.current_conflict_index >=
      current_state.pending_conflicts.length
    ) {
      update((state) => ({
        ...state,
        show_merge_screen: false,
        current_conflict_index: 0,
      }));
      return false;
    }
    return true;
  }

  function get_current_conflict(): ConflictRecord | null {
    const current_state = get({ subscribe });
    return (
      current_state.pending_conflicts[current_state.current_conflict_index] ||
      null
    );
  }

  return {
    subscribe,
    add_conflicts_from_sync_response,
    resolve_conflict,
    resolve_current_conflict,
    move_to_next_conflict,
    get_current_conflict,
    clear_all_conflicts: () => set(INITIAL_STATE),
    dismiss_merge_screen: () =>
      update((state) => ({ ...state, show_merge_screen: false })),
    get_resolved_data_for_action: (
      conflict: ConflictRecord,
      action: ConflictResolutionAction,
    ) => get_resolved_data_for_action(conflict, action, undefined),
    reset: () => set(INITIAL_STATE),
  };
}

export const conflict_store = create_conflict_store();
