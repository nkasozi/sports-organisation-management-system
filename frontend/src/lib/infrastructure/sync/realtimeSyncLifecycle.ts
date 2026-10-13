import type { RemoteChangeSubscriberPort } from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { get_database } from "../../adapters/repositories/database";
import { sync_change_tracking_gate } from "../../adapters/repositories/syncOutbox/syncChangeTrackingGate";
import type { SubscribableConvexClient } from "../cache/AuthCacheInvalidator";
import {
  type ConvexRealtimeSync,
  create_convex_realtime_sync,
  type PullTableFunction,
} from "./convexRealtimeSync";
import { TABLE_NAMES, type TableName } from "./convexSyncService";
import { sync_in_flight_work } from "./syncInFlightWork";
import { pull_table_changes_from_convex } from "./syncPullService";

interface ConvexClientWithQueryMutation {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const RealtimeSyncStatus = {
  STOPPED: "stopped",
  READY: "ready",
} as const;

type RealtimeSyncState =
  | { status: typeof RealtimeSyncStatus.STOPPED }
  | { status: typeof RealtimeSyncStatus.READY; sync: ConvexRealtimeSync };

const IGNORE_TABLE_PULLED = (): boolean => false;
const REALTIME_NOT_INITIALIZED_ERROR = "Realtime sync not initialized";
const REALTIME_ALREADY_RUNNING_ERROR = "Realtime sync already running";
const REALTIME_NOT_RUNNING_ERROR = "Realtime sync was not running";

const REALTIME_LIFECYCLE_EVENT = {
  START_SKIPPED_ALREADY_RUNNING: "realtime_sync_start_skipped_already_running",
  STARTED: "realtime_sync_started",
  STOPPED: "realtime_sync_stopped",
  PULL_SKIPPED_PAUSED: "realtime_sync_pull_skipped_paused",
} as const;

function is_running(state: RealtimeSyncState): boolean {
  switch (state.status) {
    case RealtimeSyncStatus.READY:
      return state.sync.is_running();
    case RealtimeSyncStatus.STOPPED:
      return false;
  }
}

const UNSUCCESSFUL_PULL = { success: false, records_pulled: 0 };

function skip_pull_while_paused(table_name: string): {
  success: boolean;
  records_pulled: number;
} {
  console.log("[RealtimeSync] Pull skipped while sync is paused", {
    event: REALTIME_LIFECYCLE_EVENT.PULL_SKIPPED_PAUSED,
    table_name,
  });
  return UNSUCCESSFUL_PULL;
}

function create_pull_table_adapter(
  convex_client: ConvexClientWithQueryMutation,
): PullTableFunction {
  return async (
    table_name: Parameters<PullTableFunction>[0],
  ): Promise<{ success: boolean; records_pulled: number }> =>
    sync_in_flight_work.run_if_accepting(
      async () => {
        const result = await pull_table_changes_from_convex({
          convex_client,
          database: get_database(),
          gate: sync_change_tracking_gate,
          table_name: table_name as TableName,
          correlation_id: crypto.randomUUID(),
        });
        return result.success
          ? { success: true, records_pulled: result.data.records_pulled }
          : UNSUCCESSFUL_PULL;
      },
      () => skip_pull_while_paused(table_name),
    );
}

let realtime_sync_state: RealtimeSyncState = {
  status: RealtimeSyncStatus.STOPPED,
};

export function start_realtime_sync(
  subscribable_client: SubscribableConvexClient,
  convex_client: ConvexClientWithQueryMutation,
  query_reference: unknown,
  on_table_pulled: (table_name: string) => unknown = IGNORE_TABLE_PULLED,
): boolean {
  if (is_running(realtime_sync_state)) {
    console.log("[RealtimeSync] Start skipped; already running", {
      event: REALTIME_LIFECYCLE_EVENT.START_SKIPPED_ALREADY_RUNNING,
    });
    return false;
  }
  const sync = create_convex_realtime_sync({
    subscribable_client,
    pull_table: create_pull_table_adapter(convex_client),
    table_names: [...TABLE_NAMES],
    query_reference,
    on_table_pulled,
  });
  realtime_sync_state = { status: RealtimeSyncStatus.READY, sync };
  const started = sync.start();
  console.log("[RealtimeSync] Realtime sync started", {
    event: REALTIME_LIFECYCLE_EVENT.STARTED,
    started,
    table_count: TABLE_NAMES.length,
  });
  return started;
}

export function stop_realtime_sync(): boolean {
  const state = realtime_sync_state;
  switch (state.status) {
    case RealtimeSyncStatus.STOPPED:
      return false;
    case RealtimeSyncStatus.READY: {
      const stopped = state.sync.stop();
      realtime_sync_state = { status: RealtimeSyncStatus.STOPPED };
      console.log("[RealtimeSync] Realtime sync stopped", {
        event: REALTIME_LIFECYCLE_EVENT.STOPPED,
        stopped,
      });
      return stopped;
    }
  }
}

function start_ready_sync(): Result<boolean> {
  const state = realtime_sync_state;
  switch (state.status) {
    case RealtimeSyncStatus.STOPPED:
      return create_failure_result(REALTIME_NOT_INITIALIZED_ERROR);
    case RealtimeSyncStatus.READY:
      return state.sync.start()
        ? create_success_result(true)
        : create_failure_result(REALTIME_ALREADY_RUNNING_ERROR);
  }
}

function stop_ready_sync(): Result<boolean> {
  const state = realtime_sync_state;
  const stopped =
    state.status === RealtimeSyncStatus.READY && state.sync.stop();
  return stopped
    ? create_success_result(true)
    : create_failure_result(REALTIME_NOT_RUNNING_ERROR);
}

function read_cached_table_timestamps(): ReturnType<
  RemoteChangeSubscriberPort["get_cached_table_timestamps"]
> {
  const state = realtime_sync_state;
  switch (state.status) {
    case RealtimeSyncStatus.READY:
      return state.sync.get_all_table_statuses();
    case RealtimeSyncStatus.STOPPED:
      return {};
  }
}

export function get_realtime_sync_adapter(): RemoteChangeSubscriberPort {
  return {
    start: start_ready_sync,
    stop: stop_ready_sync,
    is_running: (): boolean => is_running(realtime_sync_state),
    get_cached_table_timestamps: read_cached_table_timestamps,
  };
}
