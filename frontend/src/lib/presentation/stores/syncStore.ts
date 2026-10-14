import { type Readable, writable } from "svelte/store";

import type {
  SyncHints,
  SyncOrchestratorPort,
} from "$lib/core/interfaces/ports";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";
import {
  type ConvexSyncManager,
  get_last_sync_timestamp,
  get_sync_manager,
  initialize_sync_manager,
  type SyncConfig,
  type SyncDirection,
  type SyncResult,
} from "$lib/infrastructure/sync/convexSyncService";

import type { ConflictResolutionFeedback } from "./syncStoreConflictOutcome";
import { run_conflict_resolution, run_sync_now } from "./syncStoreOperations";
import {
  create_last_sync_time_state,
  to_orchestrator_result,
} from "./syncStoreResults";
import {
  create_empty_last_sync_result_state,
  SYNC_INITIAL_STATE,
  type SyncState,
} from "./syncStoreTypes";

type EditableConflictRecord = ScalarInput<ConflictRecord>;

interface SyncConvexClient {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

interface SyncConfigurationActions {
  initialize(config: Partial<SyncConfig>): ConvexSyncManager;
  set_convex_client(client: SyncConvexClient): boolean;
  update_config(config: Partial<SyncConfig>): SyncConfig;
  reset(): boolean;
}

interface SyncStore extends Readable<SyncState>, SyncConfigurationActions {
  sync_now(direction?: SyncDirection, hints?: SyncHints): Promise<SyncResult>;
  get_sync_orchestrator(): SyncOrchestratorPort;
  resolve_conflict_and_sync(
    conflict: EditableConflictRecord,
    action: ConflictResolutionAction,
    merged_data?: Record<string, unknown>,
  ): Promise<ConflictResolutionFeedback>;
}

function create_sync_configuration_actions(
  update: (updater: (state: SyncState) => SyncState) => void,
  set: (state: SyncState) => void,
): SyncConfigurationActions {
  return {
    initialize: (config: Partial<SyncConfig>): ConvexSyncManager => {
      const manager = initialize_sync_manager(config);
      update((state) => ({
        ...state,
        is_configured: manager.is_configured(),
        last_sync_at: create_last_sync_time_state(get_last_sync_timestamp()),
        last_sync_result: create_empty_last_sync_result_state(),
      }));
      return manager;
    },
    set_convex_client: (client: SyncConvexClient): boolean => {
      const manager = get_sync_manager();
      manager.set_convex_client(client);
      update((state) => ({ ...state, is_configured: manager.is_configured() }));
      return true;
    },
    update_config: (config: Partial<SyncConfig>): SyncConfig =>
      get_sync_manager().update_config(config),
    reset: (): boolean => {
      set(SYNC_INITIAL_STATE);
      return true;
    },
  };
}

function create_sync_store(): SyncStore {
  const { subscribe, set, update } = writable<SyncState>(SYNC_INITIAL_STATE);
  return {
    subscribe,
    ...create_sync_configuration_actions(update, set),
    sync_now: (
      direction?: SyncDirection,
      hints?: SyncHints,
    ): Promise<SyncResult> => run_sync_now(update, direction, hints),
    get_sync_orchestrator(): SyncOrchestratorPort {
      return {
        sync_now: async (direction?: SyncDirection, hints?: SyncHints) =>
          to_orchestrator_result(await this.sync_now(direction, hints)),
        is_configured: () => get_sync_manager().is_configured(),
      };
    },
    resolve_conflict_and_sync: (
      conflict: EditableConflictRecord,
      action: ConflictResolutionAction,
      merged_data?: Record<string, unknown>,
    ): Promise<ConflictResolutionFeedback> =>
      run_conflict_resolution(update, conflict, action, merged_data),
  };
}

export const sync_store = create_sync_store();
