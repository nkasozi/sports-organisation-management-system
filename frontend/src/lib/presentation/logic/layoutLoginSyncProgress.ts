import type { SyncProgressState } from "$lib/presentation/stores/syncStoreTypes";

import {
  build_sync_progress_message,
  scale_sync_percentage,
} from "./layoutLogic";
import type { LayoutLoginSyncDependencies } from "./layoutLoginSyncPorts";

const SUBSCRIPTION_STATUS = { INACTIVE: "inactive", ACTIVE: "active" } as const;
const ACTIVE_PROGRESS_STATUS = "active";

export type SyncProgressSubscriptionState =
  | { status: typeof SUBSCRIPTION_STATUS.INACTIVE }
  | { status: typeof SUBSCRIPTION_STATUS.ACTIVE; unsubscribe: () => void };

function forward_sync_progress(
  dependencies: LayoutLoginSyncDependencies,
  current_progress: SyncProgressState,
): boolean {
  if (current_progress.status !== ACTIVE_PROGRESS_STATUS) return false;
  dependencies.initial_sync_store.update_progress(
    build_sync_progress_message(
      current_progress.progress.table_name,
      current_progress.progress.tables_completed,
      current_progress.progress.total_tables,
    ),
    scale_sync_percentage(current_progress.progress.percentage),
  );
  return true;
}

export function create_inactive_sync_progress_subscription(): SyncProgressSubscriptionState {
  return { status: SUBSCRIPTION_STATUS.INACTIVE };
}

export function subscribe_to_login_sync_progress(
  dependencies: LayoutLoginSyncDependencies,
): SyncProgressSubscriptionState {
  return {
    status: SUBSCRIPTION_STATUS.ACTIVE,
    unsubscribe: dependencies.sync_store.subscribe((state) => {
      forward_sync_progress(dependencies, state.current_progress);
    }),
  };
}

export function clear_sync_progress_subscription(
  sync_progress_subscription: SyncProgressSubscriptionState,
): boolean {
  if (sync_progress_subscription.status !== SUBSCRIPTION_STATUS.ACTIVE)
    return false;
  sync_progress_subscription.unsubscribe();
  return true;
}
