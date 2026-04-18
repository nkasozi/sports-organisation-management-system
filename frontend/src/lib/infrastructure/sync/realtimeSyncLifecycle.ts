import type { RemoteChangeSubscriberPort } from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { get_database } from "../../adapters/repositories/database";
import type { SubscribableConvexClient } from "../cache/AuthCacheInvalidator";
import {
  type ConvexRealtimeSync,
  create_convex_realtime_sync,
  type PullTableFunction,
} from "./convexRealtimeSync";
import {
  get_table_from_database,
  pull_table_from_convex,
  TABLE_NAMES,
  type TableName,
} from "./convexSyncService";

interface ConvexClientWithQueryMutation {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

type RealtimeSyncState =
  | { status: "stopped" }
  | { status: "ready"; sync: ConvexRealtimeSync };

function create_pull_table_adapter(
  convex_client: ConvexClientWithQueryMutation,
): PullTableFunction {
  return async (
    table_name: Parameters<PullTableFunction>[0],
    since_timestamp: Parameters<PullTableFunction>[1],
  ): Promise<{ success: boolean; records_pulled: number }> => {
    const database = get_database();
    const table = get_table_from_database(database, table_name as TableName);

    const result = await pull_table_from_convex(
      convex_client,
      table,
      table_name as TableName,
      since_timestamp,
    );

    return result.success
      ? { success: true, records_pulled: result.data.records_pulled }
      : { success: false, records_pulled: 0 };
  };
}

let realtime_sync_state: RealtimeSyncState = { status: "stopped" };

export function start_realtime_sync(
  subscribable_client: SubscribableConvexClient,
  convex_client: ConvexClientWithQueryMutation,
  query_reference: unknown,
  on_table_pulled?: (table_name: string) => void,
): boolean {
  if (
    realtime_sync_state.status === "ready" &&
    realtime_sync_state.sync.is_running()
  ) {
    return false;
  }

  const sync = create_convex_realtime_sync({
    subscribable_client,
    pull_table: create_pull_table_adapter(convex_client),
    table_names: [...TABLE_NAMES],
    query_reference,
    on_table_pulled,
  });
  realtime_sync_state = { status: "ready", sync };

  return sync.start();
}

export function stop_realtime_sync(): boolean {
  if (realtime_sync_state.status !== "ready") {
    return false;
  }

  const stopped = realtime_sync_state.sync.stop();
  realtime_sync_state = { status: "stopped" };

  return stopped;
}

export function get_realtime_sync_adapter(): RemoteChangeSubscriberPort {
  return {
    start: () => {
      if (realtime_sync_state.status !== "ready") {
        return create_failure_result("Realtime sync not initialized");
      }

      const started = realtime_sync_state.sync.start();
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
    is_running: () =>
      realtime_sync_state.status === "ready"
        ? realtime_sync_state.sync.is_running()
        : false,
    get_cached_table_timestamps: () =>
      realtime_sync_state.status === "ready"
        ? realtime_sync_state.sync.get_all_table_statuses()
        : {},
  };
}
