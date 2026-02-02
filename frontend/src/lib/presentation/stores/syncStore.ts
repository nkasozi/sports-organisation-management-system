import { writable, derived, type Readable } from "svelte/store";
import {
  get_sync_manager,
  initialize_sync_manager,
  type SyncConfig,
  type SyncProgress,
  type SyncResult,
  type SyncStatus,
  get_last_sync_timestamp,
  resolve_conflict,
  type ConflictResolutionRequest,
} from "$lib/infrastructure/sync/convexSyncService";
import { conflict_store } from "$lib/presentation/stores/conflictStore";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";

interface SyncState {
  is_configured: boolean;
  is_syncing: boolean;
  last_sync_at: string | null;
  last_sync_result: SyncResult | null;
  current_progress: SyncProgress | null;
  auto_sync_enabled: boolean;
  error_message: string | null;
  has_pending_conflicts: boolean;
}

const initial_state: SyncState = {
  is_configured: false,
  is_syncing: false,
  last_sync_at: null,
  last_sync_result: null,
  current_progress: null,
  auto_sync_enabled: false,
  error_message: null,
  has_pending_conflicts: false,
};

function create_sync_store() {
  const { subscribe, set, update } = writable<SyncState>(initial_state);

  function handle_progress(progress: SyncProgress): void {
    update((state) => ({
      ...state,
      current_progress: progress,
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
      last_sync_at: new Date().toISOString(),
      last_sync_result: result,
      current_progress: null,
      error_message: result.success
        ? null
        : has_conflicts
          ? "Conflicts detected. Please review and resolve."
          : "Sync failed. Please try again.",
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
        last_sync_at: get_last_sync_timestamp(),
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
      update((state) => ({
        ...state,
        is_configured: manager.is_configured(),
      }));
    },

    sync_now: async (): Promise<SyncResult> => {
      update((state) => ({
        ...state,
        is_syncing: true,
        error_message: null,
        current_progress: null,
      }));

      try {
        const manager = get_sync_manager();
        const result = await manager.sync_now(handle_progress);
        handle_sync_complete(result);
        return result;
      } catch (error) {
        const error_message =
          error instanceof Error ? error.message : "Sync failed unexpectedly";
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

    start_auto_sync: () => {
      const manager = get_sync_manager();
      manager.start_auto_sync(handle_sync_complete);
      update((state) => ({
        ...state,
        auto_sync_enabled: true,
      }));
    },

    stop_auto_sync: () => {
      const manager = get_sync_manager();
      manager.stop_auto_sync();
      update((state) => ({
        ...state,
        auto_sync_enabled: false,
      }));
    },

    update_config: (config: Partial<SyncConfig>) => {
      const manager = get_sync_manager();
      manager.update_config(config);
    },

    reset: () => {
      const manager = get_sync_manager();
      manager.stop_auto_sync();
      set(initial_state);
    },

    resolve_conflict_and_sync: async (
      conflict: ConflictRecord,
      action: ConflictResolutionAction,
      merged_data?: Record<string, unknown>,
    ): Promise<{ success: boolean; error: string | null }> => {
      const manager = get_sync_manager();
      const convex_client = (
        manager as unknown as {
          convex_client: {
            mutation: (
              name: string,
              args: Record<string, unknown>,
            ) => Promise<unknown>;
            query: (
              name: string,
              args: Record<string, unknown>,
            ) => Promise<unknown>;
          } | null;
        }
      ).convex_client;

      if (!convex_client) {
        return { success: false, error: "Convex client not configured" };
      }

      let resolved_data: Record<string, unknown>;

      switch (action) {
        case "keep_local":
          resolved_data = {
            ...conflict.local_data,
            updated_at: new Date().toISOString(),
          };
          break;
        case "keep_remote":
          resolved_data = conflict.remote_data;
          break;
        case "merge":
          resolved_data = merged_data || conflict.local_data;
          break;
        default:
          resolved_data = conflict.local_data;
      }

      const request: ConflictResolutionRequest = {
        table_name: conflict.table_name,
        local_id: conflict.local_id,
        resolved_data,
        resolution_action: action,
      };

      const result = await resolve_conflict(convex_client, request);

      if (result.success) {
        update((state) => ({
          ...state,
          has_pending_conflicts: false,
        }));
      }

      return result;
    },
  };
}

export const sync_store = create_sync_store();

export const is_syncing: Readable<boolean> = derived(
  sync_store,
  ($sync_store) => $sync_store.is_syncing,
);

export const sync_progress: Readable<SyncProgress | null> = derived(
  sync_store,
  ($sync_store) => $sync_store.current_progress,
);

export const sync_percentage: Readable<number> = derived(
  sync_store,
  ($sync_store) => $sync_store.current_progress?.percentage ?? 0,
);

export const sync_status: Readable<SyncStatus> = derived(
  sync_store,
  ($sync_store) => ($sync_store.is_syncing ? "syncing" : "idle"),
);

export const last_sync_time: Readable<string | null> = derived(
  sync_store,
  ($sync_store) => $sync_store.last_sync_at,
);

export const sync_error: Readable<string | null> = derived(
  sync_store,
  ($sync_store) => $sync_store.error_message,
);

export const has_pending_conflicts: Readable<boolean> = derived(
  sync_store,
  ($sync_store) => $sync_store.has_pending_conflicts,
);
