import type { AuthCache } from "./AuthCache";
import {
  AUTH_CACHE_EVENT,
  AUTH_SNAPSHOT_STATUS,
  INVALIDATOR_STATUS,
} from "./authCacheConstants";

export interface SubscribableConvexClient {
  onUpdate(
    query_reference: unknown,
    args: Record<string, unknown>,
    callback: (result: unknown) => void,
  ): { unsubscribe: () => void };
}

interface AuthCacheInvalidatorConfig {
  convex_client: SubscribableConvexClient;
  caches_to_invalidate: AuthCache<unknown>[];
  queries_to_watch: unknown[];
}

export interface AuthCacheInvalidator {
  start(): boolean;
  stop(): boolean;
  is_running(): boolean;
}

type SnapshotState =
  | { status: typeof AUTH_SNAPSHOT_STATUS.EMPTY }
  | { status: typeof AUTH_SNAPSHOT_STATUS.READY; snapshot: string };

type Subscription = { unsubscribe: () => void };

type InvalidatorState =
  | { status: typeof INVALIDATOR_STATUS.STOPPED }
  | {
      status: typeof INVALIDATOR_STATUS.RUNNING;
      subscriptions: Subscription[];
    };

const STOPPED_STATE: InvalidatorState = { status: INVALIDATOR_STATUS.STOPPED };

function invalidate_all_caches(caches: AuthCache<unknown>[]): number {
  return caches.reduce((total, cache) => total + cache.invalidate_all(), 0);
}

function serialize_snapshot(result: unknown): string {
  return JSON.stringify(result) ?? String(result);
}

function next_snapshot_state(
  previous: SnapshotState,
  current_snapshot: string,
): { state: SnapshotState; changed: boolean } {
  const state: SnapshotState = {
    status: AUTH_SNAPSHOT_STATUS.READY,
    snapshot: current_snapshot,
  };
  switch (previous.status) {
    case AUTH_SNAPSHOT_STATUS.EMPTY:
      return { state, changed: false };
    case AUTH_SNAPSHOT_STATUS.READY:
      return { state, changed: previous.snapshot !== current_snapshot };
  }
}

function create_change_handler(
  caches: AuthCache<unknown>[],
): (result: unknown) => void {
  let snapshot_state: SnapshotState = { status: AUTH_SNAPSHOT_STATUS.EMPTY };

  return (result: unknown): void => {
    const transition = next_snapshot_state(
      snapshot_state,
      serialize_snapshot(result),
    );
    snapshot_state = transition.state;
    if (!transition.changed) return;

    const invalidated_count = invalidate_all_caches(caches);
    console.log(
      "[AuthCacheInvalidator] Auth data changed, caches invalidated",
      {
        event: AUTH_CACHE_EVENT.INVALIDATED_ON_CHANGE,
        invalidated_count,
      },
    );
  };
}

function subscribe_to_queries(
  config: AuthCacheInvalidatorConfig,
): Subscription[] {
  const change_handler = create_change_handler(config.caches_to_invalidate);
  return config.queries_to_watch.map((query_reference) =>
    config.convex_client.onUpdate(query_reference, {}, change_handler),
  );
}

export function create_auth_cache_invalidator(
  config: AuthCacheInvalidatorConfig,
): AuthCacheInvalidator {
  let state: InvalidatorState = STOPPED_STATE;

  function start(): boolean {
    if (state.status === INVALIDATOR_STATUS.RUNNING) return false;
    state = {
      status: INVALIDATOR_STATUS.RUNNING,
      subscriptions: subscribe_to_queries(config),
    };
    console.log("[AuthCacheInvalidator] Started watching auth queries", {
      event: AUTH_CACHE_EVENT.INVALIDATOR_STARTED,
      query_count: config.queries_to_watch.length,
    });
    return true;
  }

  function stop(): boolean {
    if (state.status === INVALIDATOR_STATUS.STOPPED) return false;
    for (const subscription of state.subscriptions) {
      subscription.unsubscribe();
    }
    state = STOPPED_STATE;
    console.log("[AuthCacheInvalidator] Stopped watching auth queries", {
      event: AUTH_CACHE_EVENT.INVALIDATOR_STOPPED,
    });
    return true;
  }

  return {
    start,
    stop,
    is_running: (): boolean => state.status === INVALIDATOR_STATUS.RUNNING,
  };
}
