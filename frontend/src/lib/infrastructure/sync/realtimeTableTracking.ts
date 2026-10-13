import type { RealtimeSyncDependencies } from "./convexRealtimeSync";

export const PullStatus = { IDLE: "idle", PULLING: "pulling" } as const;

export interface TableTrackingState {
  remote_latest_sequence: number;
  pulled_through_sequence: number;
  pull_count: number;
  pull_status: (typeof PullStatus)[keyof typeof PullStatus];
}

const NO_SEQUENCE = 0;
const OBJECT_TYPE_NAME = "object";
const NUMBER_TYPE_NAME = "number";

const REALTIME_TRACKING_EVENT = {
  PULL_FAILED: "realtime_sync_pull_failed",
  PULL_REJECTED: "realtime_sync_pull_unsuccessful",
  CHANGES_DETECTED: "realtime_sync_changes_detected",
} as const;

function read_marker_sequence(result: unknown): number {
  if (typeof result !== OBJECT_TYPE_NAME || !result) return NO_SEQUENCE;
  const latest_sequence = (result as Record<string, unknown>).latest_sequence;
  return typeof latest_sequence === NUMBER_TYPE_NAME
    ? Number(latest_sequence)
    : NO_SEQUENCE;
}

async function pull_until_caught_up(
  table_name: string,
  state: TableTrackingState,
  deps: RealtimeSyncDependencies,
): Promise<boolean> {
  state.pull_status = PullStatus.PULLING;
  try {
    while (state.remote_latest_sequence > state.pulled_through_sequence) {
      const target_sequence = state.remote_latest_sequence;
      state.pull_count++;
      const pull_result = await deps.pull_table(table_name);
      if (!pull_result.success) {
        console.warn("[RealtimeSync] Table pull did not complete", {
          event: REALTIME_TRACKING_EVENT.PULL_REJECTED,
          table_name,
          target_sequence,
        });
        return false;
      }
      state.pulled_through_sequence = target_sequence;
      deps.on_table_pulled(table_name);
    }
    return true;
  } catch (error) {
    console.error("[RealtimeSync] Table pull failed", {
      event: REALTIME_TRACKING_EVENT.PULL_FAILED,
      table_name,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  } finally {
    state.pull_status = PullStatus.IDLE;
  }
}

export function create_table_change_handler(
  table_name: string,
  tracking: Map<string, TableTrackingState>,
  deps: RealtimeSyncDependencies,
): (result: unknown) => unknown {
  return (result: unknown): boolean => {
    const state = tracking.get(table_name);
    if (!state) return false;
    state.remote_latest_sequence = Math.max(
      state.remote_latest_sequence,
      read_marker_sequence(result),
    );
    if (state.remote_latest_sequence <= state.pulled_through_sequence)
      return false;
    if (state.pull_status === PullStatus.PULLING) return false;
    console.log("[RealtimeSync] Remote changes detected, pulling", {
      event: REALTIME_TRACKING_EVENT.CHANGES_DETECTED,
      table_name,
      remote_latest_sequence: state.remote_latest_sequence,
    });
    void pull_until_caught_up(table_name, state, deps);
    return true;
  };
}

export function create_initial_tracking_state(): TableTrackingState {
  return {
    remote_latest_sequence: NO_SEQUENCE,
    pulled_through_sequence: NO_SEQUENCE,
    pull_count: 0,
    pull_status: PullStatus.IDLE,
  };
}
