import type { SubscribableConvexClient } from "../cache/AuthCacheInvalidator";
import {
  pull_table_from_convex,
  get_table_from_database,
  TABLE_NAMES,
  type TableName,
} from "./convexSyncService";
import { get_database } from "../../adapters/repositories/database";
import type { RemoteChangeSubscriberPort } from "$lib/core/interfaces/ports";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import {
  create_convex_realtime_sync,
  type ConvexRealtimeSync,
  type PullTableFunction,
} from "./convexRealtimeSync";

interface ConvexClientWithQueryMutation {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

function create_pull_table_adapter(
  convex_client: ConvexClientWithQueryMutation,
): PullTableFunction {
  return async (
    table_name: string,
    since_timestamp: string,
  ): Promise<{ success: boolean; records_pulled: number }> => {
    const database = get_database();
    const table = get_table_from_database(database, table_name as TableName);

    if (!table) {
      console.error(
        `[RealtimeSync] Unknown table: ${table_name}, skipping pull`,
      );
      return { success: false, records_pulled: 0 };
    }

    const result = await pull_table_from_convex(
      convex_client,
      table,
      table_name as TableName,
      since_timestamp,
    );

    return { success: result.success, records_pulled: result.records_pulled };
  };
}

let realtime_sync_instance: ConvexRealtimeSync | null = null;

export function start_realtime_sync(
  subscribable_client: SubscribableConvexClient,
  convex_client: ConvexClientWithQueryMutation,
  query_reference: unknown,
  on_table_pulled?: (table_name: string) => void,
): boolean {
  if (realtime_sync_instance?.is_running()) return false;

  realtime_sync_instance = create_convex_realtime_sync({
    subscribable_client,
    pull_table: create_pull_table_adapter(convex_client),
    table_names: [...TABLE_NAMES],
    query_reference,
    on_table_pulled,
  });

  return realtime_sync_instance.start();
}

export function stop_realtime_sync(): boolean {
  if (!realtime_sync_instance) return false;

  const stopped = realtime_sync_instance.stop();
  realtime_sync_instance = null;
  return stopped;
}

function get_realtime_sync_instance(): ConvexRealtimeSync | null {
  return realtime_sync_instance;
}

export function get_realtime_sync_adapter(): RemoteChangeSubscriberPort {
  return {
    start: () => {
      const instance = get_realtime_sync_instance();
      if (!instance)
        return create_failure_result("Realtime sync not initialized");
      const started = instance.start();
      return started
        ? create_success_result(true)
        : create_failure_result("Realtime sync already running");
    },
    stop: () => {
      const stopped = stop_realtime_sync();
      return stopped
        ? create_success_result(true)
        : create_failure_result("Realtime sync was not running");
    },
    is_running: () => realtime_sync_instance?.is_running() ?? false,
    get_cached_table_timestamps: () =>
      realtime_sync_instance?.get_all_table_statuses() ?? {},
  };
}
