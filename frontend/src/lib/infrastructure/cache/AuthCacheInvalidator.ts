import type { AuthCache } from "./AuthCache";

export interface SubscribableConvexClient {
  onUpdate(
    query_reference: unknown,
    args: Record<string, unknown>,
    callback: (result: unknown) => void,
  ): { unsubscribe: () => void };
}

export interface AuthCacheInvalidatorConfig {
  convex_client: SubscribableConvexClient;
  caches_to_invalidate: AuthCache<unknown>[];
  queries_to_watch: unknown[];
}

export interface AuthCacheInvalidator {
  start(): boolean;
  stop(): boolean;
  is_running(): boolean;
}

function invalidate_all_caches(caches: AuthCache<unknown>[]): number {
  let total_invalidated = 0;
  for (const cache of caches) {
    total_invalidated += cache.invalidate_all();
  }
  return total_invalidated;
}

function create_change_handler(
  caches: AuthCache<unknown>[],
): (result: unknown) => void {
  let previous_snapshot: string | null = null;

  return (result: unknown): void => {
    const current_snapshot = JSON.stringify(result);

    if (previous_snapshot === null) {
      previous_snapshot = current_snapshot;
      return;
    }

    if (current_snapshot === previous_snapshot) return;

    previous_snapshot = current_snapshot;
    const invalidated_count = invalidate_all_caches(caches);

    console.log(
      `[AuthCacheInvalidator] Auth data changed, invalidated ${invalidated_count} cached entries`,
    );
  };
}

export function create_auth_cache_invalidator(
  config: AuthCacheInvalidatorConfig,
): AuthCacheInvalidator {
  let active_subscriptions: Array<{ unsubscribe: () => void }> = [];
  let running = false;

  function start(): boolean {
    if (running) return false;

    const change_handler = create_change_handler(config.caches_to_invalidate);

    for (const query_reference of config.queries_to_watch) {
      const subscription = config.convex_client.onUpdate(
        query_reference,
        {},
        change_handler,
      );
      active_subscriptions.push(subscription);
    }

    running = true;

    console.log(
      `[AuthCacheInvalidator] Started watching ${config.queries_to_watch.length} auth queries for changes`,
    );

    return true;
  }

  function stop(): boolean {
    if (!running) return false;

    for (const subscription of active_subscriptions) {
      subscription.unsubscribe();
    }

    active_subscriptions = [];
    running = false;

    console.log("[AuthCacheInvalidator] Stopped watching auth queries");

    return true;
  }

  function is_running_check(): boolean {
    return running;
  }

  return { start, stop, is_running: is_running_check };
}
