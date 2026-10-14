import type { SyncDirection, SyncHints } from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { sync_in_flight_work } from "./syncInFlightWork";
import { sync_all_tables } from "./syncOrchestrator";
import {
  SYNC_ALREADY_IN_PROGRESS_ERROR,
  SYNC_PAUSED_ERROR,
} from "./syncRunSignals";
import type {
  ConvexClient,
  SyncConfig,
  SyncProgress,
  SyncResult,
  SyncStatus,
} from "./syncTypes";
import { TABLE_NAMES } from "./syncTypes";

const ALL_TABLES_ERROR_SCOPE = "all";
const CLIENT_NOT_CONFIGURED_ERROR = "Convex client not configured";
const DEFAULT_SYNC_INTERVAL_MS = 30000;
const DEFAULT_SYNC_DIRECTION: SyncDirection = "bidirectional";
const EMPTY_CONVEX_URL = "";
const IDLE_SYNC_STATUS: SyncStatus = "idle";
const SYNCING_SYNC_STATUS: SyncStatus = "syncing";

const ConvexClientStatus = {
  UNCONFIGURED: "unconfigured",
  CONFIGURED: "configured",
} as const;

const SyncManagerStatus = {
  UNINITIALIZED: "uninitialized",
  READY: "ready",
} as const;

function build_failed_sync_result(error: string): SyncResult {
  return {
    success: false,
    tables_synced: 0,
    records_pushed: 0,
    records_pulled: 0,
    errors: [{ table_name: ALL_TABLES_ERROR_SCOPE, error }],
    duration_ms: 0,
    conflicts: [],
    rejected_records: [],
    deleted_remotely: [],
  };
}

function refuse_run_during_maintenance(): SyncResult {
  console.warn("[Sync:Manager] Sync run refused during data maintenance", {
    event: "sync_manager_run_refused_maintenance",
  });
  return build_failed_sync_result(SYNC_PAUSED_ERROR);
}

type ConvexClientState =
  | { status: typeof ConvexClientStatus.UNCONFIGURED }
  | { status: typeof ConvexClientStatus.CONFIGURED; client: ConvexClient };

export class ConvexSyncManager {
  private convex_client_state: ConvexClientState = {
    status: ConvexClientStatus.UNCONFIGURED,
  };
  private config: SyncConfig;
  private is_syncing = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      convex_url: config.convex_url || EMPTY_CONVEX_URL,
      sync_interval_ms: config.sync_interval_ms || DEFAULT_SYNC_INTERVAL_MS,
      enabled_tables: config.enabled_tables || [...TABLE_NAMES],
      direction: config.direction || DEFAULT_SYNC_DIRECTION,
    };
  }

  set_convex_client(client: ConvexClient): boolean {
    this.convex_client_state = {
      status: ConvexClientStatus.CONFIGURED,
      client,
    };
    return true;
  }

  get_convex_client(): Result<ConvexClient> {
    const state = this.convex_client_state;
    switch (state.status) {
      case ConvexClientStatus.CONFIGURED:
        return create_success_result(state.client);
      case ConvexClientStatus.UNCONFIGURED:
        return create_failure_result(CLIENT_NOT_CONFIGURED_ERROR);
    }
  }

  is_configured(): boolean {
    return (
      this.convex_client_state.status === ConvexClientStatus.CONFIGURED &&
      this.config.convex_url !== EMPTY_CONVEX_URL
    );
  }

  async sync_now(
    on_progress?: (progress: SyncProgress) => void,
    direction_override?: SyncDirection,
    _hints?: SyncHints,
  ): Promise<SyncResult> {
    if (this.convex_client_state.status !== ConvexClientStatus.CONFIGURED) {
      console.error("[Sync:Manager] Convex client is not configured", {
        event: "sync_manager_client_unconfigured",
      });
      return build_failed_sync_result(CLIENT_NOT_CONFIGURED_ERROR);
    }
    if (this.is_syncing) {
      console.warn("[Sync:Manager] Sync already in progress, skipping", {
        event: "sync_manager_run_skipped_in_progress",
      });
      return build_failed_sync_result(SYNC_ALREADY_IN_PROGRESS_ERROR);
    }
    this.is_syncing = true;
    try {
      const client = this.convex_client_state.client;
      return await sync_in_flight_work.run_unless_maintenance(
        () =>
          sync_all_tables(
            client,
            direction_override ?? this.config.direction,
            this.config.enabled_tables,
            on_progress,
          ),
        refuse_run_during_maintenance,
      );
    } catch (error) {
      console.error("[Sync:Manager] Sync run threw unexpectedly", {
        event: "sync_manager_run_threw",
        error: String(error),
      });
      return build_failed_sync_result(String(error));
    } finally {
      this.is_syncing = false;
    }
  }

  update_config(new_config: Partial<SyncConfig>): SyncConfig {
    this.config = { ...this.config, ...new_config };
    return this.get_config();
  }

  get_config(): SyncConfig {
    return { ...this.config };
  }

  get_sync_status(): SyncStatus {
    return this.is_syncing ? SYNCING_SYNC_STATUS : IDLE_SYNC_STATUS;
  }
}

type SyncManagerState =
  | { status: typeof SyncManagerStatus.UNINITIALIZED }
  | { status: typeof SyncManagerStatus.READY; manager: ConvexSyncManager };

let sync_manager_state: SyncManagerState = {
  status: SyncManagerStatus.UNINITIALIZED,
};

export function get_sync_manager(): ConvexSyncManager {
  switch (sync_manager_state.status) {
    case SyncManagerStatus.READY:
      return sync_manager_state.manager;
    case SyncManagerStatus.UNINITIALIZED: {
      const manager = new ConvexSyncManager();
      sync_manager_state = { status: SyncManagerStatus.READY, manager };
      return manager;
    }
  }
}

export function initialize_sync_manager(
  config: Partial<SyncConfig>,
): ConvexSyncManager {
  const manager = new ConvexSyncManager(config);
  sync_manager_state = { status: SyncManagerStatus.READY, manager };
  return manager;
}
