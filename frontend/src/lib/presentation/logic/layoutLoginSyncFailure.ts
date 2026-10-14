import type { Result } from "$lib/core/types/Result";
import { create_failure_result } from "$lib/core/types/Result";
import type { SessionSyncRetryKind } from "$lib/presentation/stores/sessionSyncRetryNotice";

import type { LayoutLoginSyncDependencies } from "./layoutLoginSyncPorts";
import {
  clear_sync_progress_subscription,
  type SyncProgressSubscriptionState,
} from "./layoutLoginSyncProgress";
import { LAYOUT_SESSION_EVENT } from "./layoutSessionConstants";

const DISCARDED_PENDING_CHANGES_EVENT = "login_discarded_pending_local_changes";
const PENDING_CHANGE_COUNT_UNAVAILABLE_EVENT =
  "login_pending_change_count_unavailable";

export function stop_login_sync_for_retry(
  dependencies: LayoutLoginSyncDependencies,
  retry_kind: SessionSyncRetryKind,
  error_message: string,
  sync_progress_subscription: SyncProgressSubscriptionState,
): Result<never> {
  console.error("[Layout] Sign-in setup paused until retry", {
    event: LAYOUT_SESSION_EVENT.LOGIN_SYNC_FAILED,
    retry_kind,
    error: error_message,
  });
  clear_sync_progress_subscription(sync_progress_subscription);
  dependencies.set_pulling_from_remote(false);
  dependencies.initial_sync_store.reset();
  dependencies.show_sync_retry(retry_kind);
  return create_failure_result(error_message);
}

export async function log_discarded_pending_changes(
  dependencies: LayoutLoginSyncDependencies,
): Promise<number> {
  const count_result = await dependencies.get_unsynced_local_change_count();
  if (!count_result.success) {
    console.warn("[Layout] Pending change count unavailable before sign-in", {
      event: PENDING_CHANGE_COUNT_UNAVAILABLE_EVENT,
      error: count_result.error,
    });
    return 0;
  }
  if (count_result.data === 0) return 0;
  console.warn("[Layout] Sign-in replaces this device's unsynced changes", {
    event: DISCARDED_PENDING_CHANGES_EVENT,
    discarded_change_count: count_result.data,
  });
  return count_result.data;
}
