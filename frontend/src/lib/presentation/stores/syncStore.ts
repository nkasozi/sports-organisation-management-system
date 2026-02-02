import { writable, derived, type Readable } from "svelte/store";
import {
  get_sync_manager,
  initialize_sync_manager,
  type SyncConfig,
  type SyncProgress,
  type SyncResult,
  type SyncStatus,
  get_last_sync_timestamp,
} from "$lib/infrastructure/sync/convexSyncService";

interface SyncState {
  is_configured: boolean;
  is_syncing: boolean;
  last_sync_at: string | null;
  last_sync_result: SyncResult | null;
  current_progress: SyncProgress | null;
  auto_sync_enabled: boolean;
  error_message: string | null;
}

const initial_state: SyncState = {
  is_configured: false,
  is_syncing: false,
  last_sync_at: null,
  last_sync_result: null,
  current_progress: null,
  auto_sync_enabled: false,
  error_message: null,
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
    update((state) => ({
      ...state,
      is_syncing: false,
      last_sync_at: new Date().toISOString(),
      last_sync_result: result,
      current_progress: null,
      error_message: result.success
        ? null
        : result.errors.map((e) => e.error).join(", "),
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

      const manager = get_sync_manager();
      const result = await manager.sync_now(handle_progress);

      handle_sync_complete(result);
      return result;
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
  };
}

export const sync_store = create_sync_store();

export const is_syncing: Readable<boolean> = derived(
  sync_store,
  ($sync_store) => $sync_store.is_syncing,
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
