import type { SubscribableConvexClient } from "../cache/AuthCacheInvalidator";

export {
  get_realtime_sync_adapter,
  start_realtime_sync,
  stop_realtime_sync,
} from "./realtimeSyncLifecycle";

export interface TableChangeInfo {
  table_name: string;
  record_count: number;
  latest_modified_at: string;
}

export interface TableWatchStatus {
  table_name: string;
  remote_record_count: number;
  remote_latest_timestamp: string;
  pull_count: number;
}

export type PullTableFunction = (
  table_name: string,
  since_timestamp: string,
) => Promise<{ success: boolean; records_pulled: number }>;

export interface RealtimeSyncDependencies {
  subscribable_client: SubscribableConvexClient;
  pull_table: PullTableFunction;
  table_names: string[];
  query_reference?: unknown;
  on_table_pulled?: (table_name: string) => void;
}

export interface ConvexRealtimeSync {
  start(): boolean;
  stop(): boolean;
  is_running(): boolean;
  get_watched_tables(): string[];
  get_table_status(table_name: string): TableWatchStatus | null;
  get_all_table_statuses(): Record<string, string | null>;
}

interface TableTrackingState {
  latest_timestamp: string | null;
  remote_record_count: number;
  pull_count: number;
}

function create_table_change_handler(
  table_name: string,
  tracking: Map<string, TableTrackingState>,
  pull_table: PullTableFunction,
  on_table_pulled?: (table_name: string) => void,
): (result: unknown) => void {
  return (result: unknown): void => {
    const change_info = result as TableChangeInfo;
    const current_state = tracking.get(table_name);

    if (!current_state) return;

    const new_timestamp = change_info.latest_modified_at;
    const previous_timestamp = current_state.latest_timestamp;

    current_state.remote_record_count = change_info.record_count;

    if (previous_timestamp === null) {
      current_state.latest_timestamp = new_timestamp;
      return;
    }

    if (new_timestamp === previous_timestamp) return;

    current_state.latest_timestamp = new_timestamp;
    current_state.pull_count++;

    console.log(
      `[RealtimeSync] ${table_name} changed remotely (${previous_timestamp} → ${new_timestamp}), triggering pull`,
    );

    pull_table(table_name, previous_timestamp)
      .then(() => {
        on_table_pulled?.(table_name);
      })
      .catch((error) => {
        console.error("[RealtimeSync] Table pull failed", {
          event: "realtime_sync_pull_failed",
          table_name,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  };
}

export function create_convex_realtime_sync(
  deps: RealtimeSyncDependencies,
): ConvexRealtimeSync {
  let active_subscriptions: Array<{ unsubscribe: () => void }> = [];
  let running = false;
  const table_tracking = new Map<string, TableTrackingState>();

  function start(): boolean {
    if (running) return false;

    for (const table_name of deps.table_names) {
      table_tracking.set(table_name, {
        latest_timestamp: null,
        remote_record_count: 0,
        pull_count: 0,
      });

      const handler = create_table_change_handler(
        table_name,
        table_tracking,
        deps.pull_table,
        deps.on_table_pulled,
      );

      const query_ref = deps.query_reference ?? "sync:get_latest_modified_at";

      const subscription = deps.subscribable_client.onUpdate(
        query_ref,
        { table_name },
        handler,
      );

      active_subscriptions.push(subscription);
    }

    running = true;

    console.log(
      `[RealtimeSync] Started watching ${deps.table_names.length} tables for remote changes`,
    );

    return true;
  }

  function stop(): boolean {
    if (!running) return false;

    for (const subscription of active_subscriptions) {
      subscription.unsubscribe();
    }

    active_subscriptions = [];
    table_tracking.clear();
    running = false;

    console.log("[RealtimeSync] Stopped watching tables");

    return true;
  }

  function is_running_check(): boolean {
    return running;
  }

  function get_watched_tables(): string[] {
    return [...deps.table_names];
  }

  function get_table_status(table_name: string): TableWatchStatus | null {
    const state = table_tracking.get(table_name);
    if (!state) return null;

    return {
      table_name,
      remote_record_count: state.remote_record_count,
      remote_latest_timestamp: state.latest_timestamp ?? "",
      pull_count: state.pull_count,
    };
  }

  function get_all_table_statuses_map(): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    for (const [table_name, state] of table_tracking.entries()) {
      result[table_name] = state.latest_timestamp;
    }
    return result;
  }

  return {
    start,
    stop,
    is_running: is_running_check,
    get_watched_tables,
    get_table_status,
    get_all_table_statuses: get_all_table_statuses_map,
  };
}
