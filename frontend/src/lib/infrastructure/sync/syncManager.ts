import type { SyncDirection, SyncHints } from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { sync_all_tables } from "./syncOrchestrator";
import type {
  ConvexClient,
  SyncConfig,
  SyncProgress,
  SyncResult,
  SyncStatus,
} from "./syncTypes";
import { TABLE_NAMES } from "./syncTypes";

type ConvexClientState =
  | { status: "unconfigured" }
  | { status: "configured"; client: ConvexClient };

type AutoSyncIntervalState =
  | { status: "stopped" }
  | { status: "running"; timer_id: number };

export class ConvexSyncManager {
  private convex_client_state: ConvexClientState = {
    status: "unconfigured",
  };
  private auto_sync_interval_state: AutoSyncIntervalState = {
    status: "stopped",
  };
  private config: SyncConfig;
  private is_syncing = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      convex_url: config.convex_url || "",
      sync_interval_ms: config.sync_interval_ms || 30000,
      enabled_tables: config.enabled_tables || [...TABLE_NAMES],
      direction: config.direction || "bidirectional",
    };
  }

  set_convex_client(client: ConvexClient): void {
    this.convex_client_state = { status: "configured", client };
  }

  get_convex_client(): Result<ConvexClient> {
    return this.convex_client_state.status === "configured"
      ? create_success_result(this.convex_client_state.client)
      : create_failure_result("Convex client not configured");
  }

  is_configured(): boolean {
    return (
      this.convex_client_state.status === "configured" &&
      this.config.convex_url !== ""
    );
  }

  async sync_now(
    on_progress?: (progress: SyncProgress) => void,
    direction_override?: SyncDirection,
    hints?: SyncHints,
  ): Promise<SyncResult> {
    if (this.convex_client_state.status !== "configured") {
      console.error(
        "[Sync:Manager] sync_now called but Convex client is NOT configured",
      );
      return {
        success: false,
        tables_synced: 0,
        records_pushed: 0,
        records_pulled: 0,
        errors: [{ table_name: "all", error: "Convex client not configured" }],
        duration_ms: 0,
        conflicts: [],
      };
    }

    const convex_client = this.convex_client_state.client;

    if (this.is_syncing) {
      console.warn(
        "[Sync:Manager] sync_now called but sync is already in progress, skipping",
      );
      return {
        success: false,
        tables_synced: 0,
        records_pushed: 0,
        records_pulled: 0,
        errors: [{ table_name: "all", error: "Sync already in progress" }],
        duration_ms: 0,
        conflicts: [],
      };
    }

    this.is_syncing = true;
    const effective_direction = direction_override ?? this.config.direction;
    console.log(
      `[Sync:Manager] sync_now starting — direction: ${effective_direction}, tables: ${this.config.enabled_tables.length}`,
    );

    const result = await sync_all_tables(
      convex_client,
      effective_direction,
      this.config.enabled_tables,
      on_progress,
      void 0,
      hints,
    );

    this.is_syncing = false;
    return result;
  }

  start_auto_sync(on_sync_complete?: (result: SyncResult) => void): void {
    if (this.auto_sync_interval_state.status === "running") return;

    this.auto_sync_interval_state = {
      status: "running",
      timer_id: window.setInterval(async () => {
        const result = await this.sync_now();
        if (on_sync_complete) on_sync_complete(result);
      }, this.config.sync_interval_ms),
    };
  }

  stop_auto_sync(): void {
    if (this.auto_sync_interval_state.status !== "running") return;

    window.clearInterval(this.auto_sync_interval_state.timer_id);
    this.auto_sync_interval_state = { status: "stopped" };
  }

  update_config(new_config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...new_config };
  }

  get_config(): SyncConfig {
    return { ...this.config };
  }

  get_sync_status(): SyncStatus {
    return this.is_syncing ? "syncing" : "idle";
  }
}

type SyncManagerState =
  | { status: "uninitialized" }
  | { status: "ready"; manager: ConvexSyncManager };

let sync_manager_state: SyncManagerState = { status: "uninitialized" };

export function get_sync_manager(): ConvexSyncManager {
  if (sync_manager_state.status === "ready") {
    return sync_manager_state.manager;
  }

  const manager = new ConvexSyncManager();
  sync_manager_state = { status: "ready", manager };

  return manager;
}

export function initialize_sync_manager(
  config: Partial<SyncConfig>,
): ConvexSyncManager {
  const manager = new ConvexSyncManager(config);
  sync_manager_state = { status: "ready", manager };

  return manager;
}
