import { writable } from "svelte/store";

import type {
  SyncHints,
  SyncMetrics,
  SyncOrchestratorPort,
  SyncTableError,
} from "$lib/core/interfaces/ports";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import {
  get_last_sync_timestamp,
  get_sync_manager,
  initialize_sync_manager,
  type SyncConfig,
  type SyncDirection,
  type SyncProgress,
  type SyncResult,
} from "$lib/infrastructure/sync/convexSyncService";
import { EPOCH_TIMESTAMP } from "$lib/infrastructure/sync/syncTypes";
import { conflict_store } from "$lib/presentation/stores/conflictStore";

import { execute_conflict_resolution } from "./syncStoreResolveConflict";
import {
  create_empty_last_sync_result_state,
  create_never_last_sync_time_state,
  create_recorded_last_sync_result_state,
  create_recorded_last_sync_time_state,
  SYNC_INITIAL_STATE,
  type SyncState,
} from "./syncStoreTypes";

type EditableConflictRecord = ScalarInput<ConflictRecord>;

const SYNC_CONFLICT_ERROR_MESSAGE =
  "Conflicts detected. Please review and resolve.";
const SYNC_FALLBACK_ERROR_MESSAGE = "Sync failed. Please try again.";
const SYNC_UNEXPECTED_FAILURE_MESSAGE = "Sync failed unexpectedly";

function resolve_sync_error_message(result: SyncResult): string {
  const has_conflicts = !!result.conflicts && result.conflicts.length > 0;
  if (has_conflicts) {
    return SYNC_CONFLICT_ERROR_MESSAGE;
  }
  return result.errors[0]?.error ?? SYNC_FALLBACK_ERROR_MESSAGE;
}

function create_last_sync_time_state(timestamp: string) {
  if (timestamp === EPOCH_TIMESTAMP) {
    return create_never_last_sync_time_state();
  }

  return create_recorded_last_sync_time_state(timestamp);
}

function create_sync_store() {
  const { subscribe, set, update } = writable<SyncState>(SYNC_INITIAL_STATE);
  function handle_progress(progress: SyncProgress): void {
    update((state) => ({
      ...state,
      current_progress: { status: "active", progress },
      is_syncing: progress.status === "syncing",
    }));
  }

  function handle_sync_complete(result: SyncResult): void {
    if (!result.success && result.errors.length > 0) {
      console.error("[Sync] Sync completed with errors:", result.errors);
    }
    const has_conflicts = result.conflicts && result.conflicts.length > 0;
    if (has_conflicts) {
      for (const table_conflict of result.conflicts) {
        conflict_store.add_conflicts_from_sync_response(
          table_conflict.table_name,
          table_conflict.conflicts,
        );
      }
    }
    update((state) => ({
      ...state,
      is_syncing: false,
      last_sync_at: create_recorded_last_sync_time_state(
        new Date().toISOString(),
      ),
      last_sync_result: create_recorded_last_sync_result_state(result),
      current_progress: { status: "idle" },
      error_message: result.success
        ? { status: "clear" }
        : {
            status: "present",
            message: resolve_sync_error_message(result),
          },
      has_pending_conflicts: has_conflicts,
    }));
  }

  return {
    subscribe,
    initialize: (config: Partial<SyncConfig>) => {
      const manager = initialize_sync_manager(config);
      update((state) => ({
        ...state,
        is_configured: manager.is_configured(),
        last_sync_at: create_last_sync_time_state(get_last_sync_timestamp()),
        last_sync_result: create_empty_last_sync_result_state(),
      }));
      return manager;
    },

    set_convex_client: (client: {
      mutation: (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<unknown>;
      query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
    }) => {
      const manager = get_sync_manager();
      manager.set_convex_client(client);
      update((state) => ({ ...state, is_configured: manager.is_configured() }));
    },

    sync_now: async (
      direction?: SyncDirection,
      hints?: SyncHints,
    ): Promise<SyncResult> => {
      update((state) => ({
        ...state,
        is_syncing: true,
        error_message: { status: "clear" },
        current_progress: { status: "idle" },
      }));
      try {
        const manager = get_sync_manager();
        const result = await manager.sync_now(
          handle_progress,
          direction,
          hints,
        );
        handle_sync_complete(result);
        return result;
      } catch (error) {
        const error_message =
          error instanceof Error
            ? error.message
            : SYNC_UNEXPECTED_FAILURE_MESSAGE;
        console.error("[Sync] Unexpected sync failure", {
          event: "sync_unexpected_failure",
          error: String(error_message),
        });
        const failed_result: SyncResult = {
          success: false,
          tables_synced: 0,
          records_pushed: 0,
          records_pulled: 0,
          errors: [{ table_name: "unknown", error: error_message }],
          duration_ms: 0,
          conflicts: [],
        };
        handle_sync_complete(failed_result);
        return failed_result;
      }
    },

    get_sync_orchestrator(): SyncOrchestratorPort {
      return {
        sync_now: async (direction?: SyncDirection, hints?: SyncHints) => {
          const result = await this.sync_now(direction, hints);
          if (!result.success) {
            return create_failure_result<SyncTableError>({
              failed_tables: result.errors,
              message: result.errors[0]?.error ?? "Sync failed",
            });
          }
          const metrics: SyncMetrics = {
            tables_synced: result.tables_synced,
            records_pushed: result.records_pushed,
            records_pulled: result.records_pulled,
            duration_ms: result.duration_ms,
            conflicts: result.conflicts,
          };
          return create_success_result(metrics);
        },
        is_configured: () => get_sync_manager().is_configured(),
      };
    },
    start_auto_sync: () => {
      const manager = get_sync_manager();
      manager.start_auto_sync(handle_sync_complete);
      update((state) => ({ ...state, auto_sync_enabled: true }));
    },
    stop_auto_sync: () => {
      const manager = get_sync_manager();
      manager.stop_auto_sync();
      update((state) => ({ ...state, auto_sync_enabled: false }));
    },
    update_config: (config: Partial<SyncConfig>) => {
      get_sync_manager().update_config(config);
    },
    reset: () => {
      get_sync_manager().stop_auto_sync();
      set(SYNC_INITIAL_STATE);
    },
    resolve_conflict_and_sync: async (
      conflict: EditableConflictRecord,
      action: ConflictResolutionAction,
      merged_data?: Record<string, unknown>,
    ): Promise<{ success: true } | { success: false; error: string }> => {
      const manager = get_sync_manager();
      const convex_client_result = manager.get_convex_client();
      const result = await execute_conflict_resolution(
        convex_client_result,
        conflict,
        action,
        merged_data,
      );
      if (result.success) {
        update((state) => ({ ...state, has_pending_conflicts: false }));
      }
      return result;
    },
  };
}

export const sync_store = create_sync_store();
