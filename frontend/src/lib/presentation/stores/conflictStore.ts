import { writable, derived, get } from "svelte/store";
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
import {
  log_conflict_detected,
  log_conflict_resolution,
} from "$lib/infrastructure/sync/conflictAuditService";

export interface ConflictStoreState {
  pending_conflicts: ConflictRecord[];
  resolved_conflicts: ConflictResolution[];
  is_resolution_in_progress: boolean;
  current_conflict_index: number;
  show_merge_screen: boolean;
}

function create_conflict_store() {
  const initial_state: ConflictStoreState = {
    pending_conflicts: [],
    resolved_conflicts: [],
    is_resolution_in_progress: false,
    current_conflict_index: 0,
    show_merge_screen: false,
  };

  const { subscribe, set, update } =
    writable<ConflictStoreState>(initial_state);

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
        console.error("[ConflictStore] Failed to audit log conflict:", err);
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
  ): ConflictResolution | null {
    const current_state = get({ subscribe });
    const conflict = current_state.pending_conflicts.find(
      (c) => c.id === conflict_id,
    );

    if (!conflict) return null;

    const resolution: ConflictResolution = {
      conflict_id,
      table_name: conflict.table_name,
      local_id: conflict.local_id,
      action,
      resolved_at: new Date().toISOString(),
      resolved_by: null,
      merged_data,
    };

    const resolved_data = get_resolved_data_for_action_internal(
      conflict,
      action,
      merged_data,
    );

    log_conflict_resolution(conflict, action, resolved_data).catch((err) => {
      console.error(
        "[ConflictStore] Failed to audit log conflict resolution:",
        err,
      );
    });

    update((state) => ({
      ...state,
      pending_conflicts: state.pending_conflicts.filter(
        (c) => c.id !== conflict_id,
      ),
      resolved_conflicts: [...state.resolved_conflicts, resolution],
    }));

    return resolution;
  }

  function get_resolved_data_for_action_internal(
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

  function resolve_current_conflict(
    action: ConflictResolutionAction,
    merged_data?: Record<string, unknown>,
  ): ConflictResolution | null {
    const current_state = get({ subscribe });
    const current_conflict =
      current_state.pending_conflicts[current_state.current_conflict_index];

    if (!current_conflict) return null;

    return resolve_conflict(current_conflict.id, action, merged_data);
  }

  function move_to_next_conflict(): boolean {
    const current_state = get({ subscribe });
    const next_index = current_state.current_conflict_index;

    if (next_index >= current_state.pending_conflicts.length) {
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

  function clear_all_conflicts(): void {
    set(initial_state);
  }

  function dismiss_merge_screen(): void {
    update((state) => ({
      ...state,
      show_merge_screen: false,
    }));
  }

  function get_resolved_data_for_action(
    conflict: ConflictRecord,
    action: ConflictResolutionAction,
  ): Record<string, unknown> {
    return get_resolved_data_for_action_internal(conflict, action, undefined);
  }

  return {
    subscribe,
    add_conflicts_from_sync_response,
    resolve_conflict,
    resolve_current_conflict,
    move_to_next_conflict,
    get_current_conflict,
    clear_all_conflicts,
    dismiss_merge_screen,
    get_resolved_data_for_action,
    reset: () => set(initial_state),
  };
}

export const conflict_store = create_conflict_store();

export const pending_conflicts = derived(
  conflict_store,
  ($store) => $store.pending_conflicts,
);

export const has_pending_conflicts = derived(
  conflict_store,
  ($store) => $store.pending_conflicts.length > 0,
);

export const pending_conflict_count = derived(
  conflict_store,
  ($store) => $store.pending_conflicts.length,
);

export const show_merge_screen = derived(
  conflict_store,
  ($store) => $store.show_merge_screen,
);

export const current_conflict = derived(
  conflict_store,
  ($store) => $store.pending_conflicts[$store.current_conflict_index] || null,
);

export const conflict_progress = derived(conflict_store, ($store) => ({
  current: $store.current_conflict_index + 1,
  total: $store.pending_conflicts.length + $store.resolved_conflicts.length,
  resolved: $store.resolved_conflicts.length,
}));
