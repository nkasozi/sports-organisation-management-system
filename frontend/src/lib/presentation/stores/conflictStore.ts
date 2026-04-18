import { get, writable } from "svelte/store";

import type { ScalarInput } from "$lib/core/types/DomainScalars";
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
  create_unknown_conflict_field_value,
  generate_conflict_id,
  get_entity_display_name,
} from "$lib/infrastructure/sync/conflictTypes";
import type { ConflictFromServer } from "$lib/infrastructure/sync/syncTypes";

import type {
  ConflictStoreState,
  CurrentConflictState,
} from "./conflictStoreHelpers";
import {
  create_current_conflict_state,
  get_resolved_data_for_action,
} from "./conflictStoreHelpers";
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
    conflicts: ConflictFromServer[],
  ): boolean {
    if (conflicts.length === 0) return false;

    const new_conflicts: ScalarInput<ConflictRecord>[] = conflicts.map(
      (conflict) => ({
        id: generate_conflict_id(
          table_name,
          conflict.local_id as ConflictRecord["local_id"],
        ),
        table_name,
        local_id: conflict.local_id as ConflictRecord["local_id"],
        entity_display_name: get_entity_display_name(
          conflict.local_data,
          table_name,
        ),
        local_data: conflict.local_data,
        remote_data: conflict.remote_data,
        local_updated_at:
          (conflict.local_data
            .updated_at as ConflictRecord["local_updated_at"]) ||
          create_conflict_timestamp(),
        remote_updated_at:
          conflict.remote_updated_at as ConflictRecord["remote_updated_at"],
        remote_updated_by: conflict.remote_updated_by,
        remote_updated_by_name: create_unknown_conflict_field_value(),
        field_differences: compute_field_differences(
          conflict.local_data,
          conflict.remote_data,
        ),
        detected_at: create_conflict_timestamp(),
      }),
    );

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
  ): Result<ScalarInput<ConflictResolution>> {
    const current_state = get({ subscribe });
    const conflict = current_state.pending_conflicts.find(
      (c) => c.id === conflict_id,
    );
    if (!conflict)
      return create_failure_result(`Conflict not found: ${conflict_id}`);

    const resolution: ScalarInput<ConflictResolution> = {
      conflict_id,
      table_name: conflict.table_name,
      local_id: conflict.local_id,
      action,
      resolved_at: create_conflict_timestamp(),
      resolved_by: create_unknown_conflict_field_value(),
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
  ): Result<ScalarInput<ConflictResolution>> {
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

  function get_current_conflict(): CurrentConflictState {
    const current_state = get({ subscribe });
    return create_current_conflict_state(
      current_state.pending_conflicts,
      current_state.current_conflict_index,
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
      conflict: ScalarInput<ConflictRecord>,
      action: ConflictResolutionAction,
    ) => get_resolved_data_for_action(conflict, action, undefined),
    reset: () => set(INITIAL_STATE),
  };
}

function create_conflict_timestamp(): ConflictRecord["detected_at"] {
  return new Date().toISOString() as ConflictRecord["detected_at"];
}

export const conflict_store = create_conflict_store();
