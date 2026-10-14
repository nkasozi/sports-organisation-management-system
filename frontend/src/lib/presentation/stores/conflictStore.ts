import { get, type Readable, writable } from "svelte/store";

import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import type { ConflictFromServer } from "$lib/infrastructure/sync/syncTypes";

import {
  add_conflicts_from_sync_response,
  type ConflictResolutionResult,
  type ConflictStoreContext,
  resolve_conflict,
  resolve_current_conflict,
} from "./conflictStoreActions";
import type {
  ConflictStoreState,
  CurrentConflictState,
} from "./conflictStoreHelpers";
import {
  create_current_conflict_state,
  get_resolved_data_for_action,
} from "./conflictStoreHelpers";
import {
  refresh_conflict_remote_copy,
  remove_conflict,
} from "./conflictStoreRefresh";
const INITIAL_STATE: ConflictStoreState = {
  pending_conflicts: [],
  resolved_conflicts: [],
  is_resolution_in_progress: false,
  current_conflict_index: 0,
  show_merge_screen: false,
};

function move_to_next_conflict(context: ConflictStoreContext): boolean {
  const current_state = context.read_state();
  if (
    current_state.current_conflict_index <
    current_state.pending_conflicts.length
  ) {
    return true;
  }
  context.update((state) => ({
    ...state,
    show_merge_screen: false,
    current_conflict_index: 0,
  }));
  return false;
}

function get_current_conflict(
  context: ConflictStoreContext,
): CurrentConflictState {
  const current_state = context.read_state();
  return create_current_conflict_state(
    current_state.pending_conflicts,
    current_state.current_conflict_index,
  );
}

interface ConflictStore extends Readable<ConflictStoreState> {
  add_conflicts_from_sync_response(
    table_name: string,
    conflicts: ConflictFromServer[],
  ): boolean;
  resolve_conflict(
    conflict_id: string,
    action: ConflictResolutionAction,
    merged_data?: Record<string, unknown>,
  ): ConflictResolutionResult;
  resolve_current_conflict(
    action: ConflictResolutionAction,
    merged_data?: Record<string, unknown>,
  ): ConflictResolutionResult;
  refresh_conflict_remote_copy(
    conflict_id: string,
    remote_data: Record<string, unknown>,
    remote_version: number,
  ): boolean;
  remove_conflict(conflict_id: string): boolean;
  move_to_next_conflict(): boolean;
  get_current_conflict(): CurrentConflictState;
  clear_all_conflicts(): boolean;
  dismiss_merge_screen(): boolean;
  get_resolved_data_for_action(
    conflict: ScalarInput<ConflictRecord>,
    action: ConflictResolutionAction,
  ): Record<string, unknown>;
  reset(): boolean;
}

function create_conflict_store(): ConflictStore {
  const { subscribe, set, update } =
    writable<ConflictStoreState>(INITIAL_STATE);
  const context: ConflictStoreContext = {
    read_state: (): ConflictStoreState => get({ subscribe }),
    update,
  };
  const reset_state = (): boolean => {
    set(INITIAL_STATE);
    return true;
  };

  return {
    subscribe,
    add_conflicts_from_sync_response: (table_name, conflicts) =>
      add_conflicts_from_sync_response(context, table_name, conflicts),
    resolve_conflict: (conflict_id, action, merged_data) =>
      resolve_conflict(context, conflict_id, action, merged_data),
    resolve_current_conflict: (action, merged_data) =>
      resolve_current_conflict(context, action, merged_data),
    refresh_conflict_remote_copy: (conflict_id, remote_data, remote_version) =>
      refresh_conflict_remote_copy(
        context,
        conflict_id,
        remote_data,
        remote_version,
      ),
    remove_conflict: (conflict_id) => remove_conflict(context, conflict_id),
    move_to_next_conflict: () => move_to_next_conflict(context),
    get_current_conflict: () => get_current_conflict(context),
    clear_all_conflicts: reset_state,
    dismiss_merge_screen: () => {
      update((state) => ({ ...state, show_merge_screen: false }));
      return true;
    },
    get_resolved_data_for_action,
    reset: reset_state,
  };
}

export const conflict_store = create_conflict_store();
