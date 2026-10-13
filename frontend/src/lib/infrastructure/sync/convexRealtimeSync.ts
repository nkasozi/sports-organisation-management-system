import type { SubscribableConvexClient } from "../cache/AuthCacheInvalidator";
import {
  create_initial_tracking_state,
  create_table_change_handler,
  type TableTrackingState,
} from "./realtimeTableTracking";

export {
  get_realtime_sync_adapter,
  start_realtime_sync,
  stop_realtime_sync,
} from "./realtimeSyncLifecycle";

export const DEFAULT_CHANGE_MARKER_QUERY = "sync:get_table_change_marker";

interface TableWatchStatus {
  table_name: string;
  remote_latest_sequence: number;
  pulled_through_sequence: number;
  pull_count: number;
}

export type TableStatusLookupResult =
  | { status: "found"; table_status: TableWatchStatus }
  | { status: "missing" };

export type PullTableFunction = (
  table_name: string,
) => Promise<{ success: boolean; records_pulled: number }>;

export interface RealtimeSyncDependencies {
  subscribable_client: SubscribableConvexClient;
  pull_table: PullTableFunction;
  table_names: string[];
  query_reference: unknown;
  on_table_pulled: (table_name: string) => unknown;
}

export interface ConvexRealtimeSync {
  start(): boolean;
  stop(): boolean;
  is_running(): boolean;
  get_watched_tables(): string[];
  get_table_status(table_name: string): TableStatusLookupResult;
  get_all_table_statuses(): Record<string, string>;
}

interface RealtimeWatcherContext {
  deps: RealtimeSyncDependencies;
  subscriptions: Array<{ unsubscribe: () => void }>;
  running: boolean;
  tracking: Map<string, TableTrackingState>;
}

function start_watching(context: RealtimeWatcherContext): boolean {
  if (context.running) return false;
  for (const table_name of context.deps.table_names) {
    context.tracking.set(table_name, create_initial_tracking_state());
    context.subscriptions.push(
      context.deps.subscribable_client.onUpdate(
        context.deps.query_reference,
        { table_name },
        create_table_change_handler(table_name, context.tracking, context.deps),
      ),
    );
  }
  context.running = true;
  console.log("[RealtimeSync] Started watching tables for remote changes", {
    event: "realtime_sync_started",
    table_count: context.deps.table_names.length,
  });
  return true;
}

function stop_watching(context: RealtimeWatcherContext): boolean {
  if (!context.running) return false;
  context.subscriptions.forEach((subscription) => subscription.unsubscribe());
  context.subscriptions = [];
  context.tracking.clear();
  context.running = false;
  console.log("[RealtimeSync] Stopped watching tables", {
    event: "realtime_sync_stopped",
  });
  return true;
}

function read_table_status(
  context: RealtimeWatcherContext,
  table_name: string,
): TableStatusLookupResult {
  const state = context.tracking.get(table_name);
  if (!state) return { status: "missing" };
  return {
    status: "found",
    table_status: {
      table_name,
      remote_latest_sequence: state.remote_latest_sequence,
      pulled_through_sequence: state.pulled_through_sequence,
      pull_count: state.pull_count,
    },
  };
}

export function create_convex_realtime_sync(
  deps: RealtimeSyncDependencies,
): ConvexRealtimeSync {
  const context: RealtimeWatcherContext = {
    deps,
    subscriptions: [],
    running: false,
    tracking: new Map(),
  };
  return {
    start: () => start_watching(context),
    stop: () => stop_watching(context),
    is_running: () => context.running,
    get_watched_tables: () => [...deps.table_names],
    get_table_status: (table_name) => read_table_status(context, table_name),
    get_all_table_statuses: () =>
      Object.fromEntries(
        [...context.tracking.entries()].map(([table_name, state]) => [
          table_name,
          String(state.remote_latest_sequence),
        ]),
      ),
  };
}
