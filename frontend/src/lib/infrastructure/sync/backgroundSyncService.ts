import { get_database } from "$lib/adapters/repositories/database";
import { ALLOWED_SYNC_INTERVALS_MS } from "$lib/core/entities/OrganizationSettings";
import type { LocalSyncStatus } from "$lib/core/interfaces/ports";
import type { AsyncResult, Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { cancel_automatic_device_backup_write } from "../backup/storageBackupScheduler";
import {
  configure_orchestrator,
  configure_remote_subscriber,
  configure_restoration_handlers,
} from "./backgroundSyncConfiguration";
import { sync_engine_runtime } from "./backgroundSyncRuntimeInstance";
import { sync_deferred_remote_changes } from "./syncDeferredRemoteChanges";
import {
  SyncEngineEventType,
  SyncEngineStatus,
  SyncRunKind,
} from "./syncEngineTypes";
import {
  count_unsynced_changes,
  reset_sync_bookkeeping,
} from "./syncOutboxRepository";

export {
  pause_remote_change_subscriptions,
  resume_remote_change_subscriptions,
} from "./remoteSubscriptionPause";
export { enqueue_all_local_records_for_push } from "./syncOutboxSnapshot";
export {
  configure_orchestrator,
  configure_remote_subscriber,
  configure_restoration_handlers,
};

const UNDEFINED_TYPE_NAME = "undefined";
const ONLINE_EVENT_NAME = "online";
const OFFLINE_EVENT_NAME = "offline";
const FLUSH_FAILED_MESSAGE = "Flush failed — check logs for push sync errors";
const UNSYNCED_AFTER_FLUSH_SUFFIX =
  "local change(s) could not be synced (rejected by the server or in conflict)";

function handle_online_event(): boolean {
  sync_engine_runtime.dispatch({
    type: SyncEngineEventType.WENT_ONLINE,
    next_run_id: crypto.randomUUID(),
  });
  return true;
}

function handle_offline_event(): boolean {
  sync_engine_runtime.dispatch({ type: SyncEngineEventType.WENT_OFFLINE });
  return true;
}

async function kick_pending_changes(): Promise<boolean> {
  const summary = await sync_engine_runtime.refresh_outbox_summary();
  if (!summary.success || summary.data.pending_count === 0) return false;
  sync_engine_runtime.dispatch({
    type: SyncEngineEventType.LOCAL_CHANGE_RECORDED,
  });
  return true;
}

function is_engine_stopped(): boolean {
  return (
    sync_engine_runtime.get_machine().state.status === SyncEngineStatus.STOPPED
  );
}

export function set_pulling_from_remote(
  is_pulling_from_remote: boolean,
): boolean {
  sync_engine_runtime.dispatch({
    type: is_pulling_from_remote
      ? SyncEngineEventType.SUSPEND
      : SyncEngineEventType.RESUME,
  });
  if (!is_pulling_from_remote) void kick_pending_changes();
  return true;
}

export function start_background_sync(): boolean {
  if (typeof window === UNDEFINED_TYPE_NAME) return false;
  if (!is_engine_stopped()) {
    void kick_pending_changes();
    return false;
  }
  window.addEventListener(ONLINE_EVENT_NAME, handle_online_event);
  window.addEventListener(OFFLINE_EVENT_NAME, handle_offline_event);
  sync_engine_runtime.dispatch({
    type: SyncEngineEventType.START,
    is_online: navigator.onLine,
  });
  void kick_pending_changes();
  console.log("[BackgroundSync] Started", {
    event: "background_sync_started",
  });
  return true;
}

export function stop_background_sync(): boolean {
  if (is_engine_stopped()) return false;
  cancel_automatic_device_backup_write();
  sync_engine_runtime.dispatch({ type: SyncEngineEventType.STOP });
  if (typeof window !== UNDEFINED_TYPE_NAME) {
    window.removeEventListener(ONLINE_EVENT_NAME, handle_online_event);
    window.removeEventListener(OFFLINE_EVENT_NAME, handle_offline_event);
  }
  console.log("[BackgroundSync] Stopped — configuration retained", {
    event: "background_sync_stopped",
  });
  return true;
}

export function get_background_sync_status(): LocalSyncStatus {
  return {
    is_running: !is_engine_stopped(),
    has_pending_changes: has_pending_unsynced_changes(),
    is_online: sync_engine_runtime.get_machine().is_online,
  };
}

export function has_pending_unsynced_changes(): boolean {
  return count_unsynced_changes(sync_engine_runtime.get_outbox_summary()) > 0;
}

export async function get_unsynced_local_change_count(): AsyncResult<number> {
  const summary = await sync_engine_runtime.refresh_outbox_summary();
  return summary.success
    ? create_success_result(count_unsynced_changes(summary.data))
    : summary;
}

export async function flush_pending_changes(): AsyncResult<{
  skipped_offline: boolean;
}> {
  const live_pending_count = await get_unsynced_local_change_count();
  if (!live_pending_count.success) return live_pending_count;
  if (live_pending_count.data === 0)
    return create_success_result({ skipped_offline: false });
  if (!sync_engine_runtime.get_machine().is_online)
    return create_success_result({ skipped_offline: true });
  const run_succeeded = await sync_engine_runtime.request_run(SyncRunKind.PUSH);
  if (!run_succeeded) return create_failure_result(FLUSH_FAILED_MESSAGE);
  const remaining = await get_unsynced_local_change_count();
  if (!remaining.success) return remaining;
  return remaining.data === 0
    ? create_success_result({ skipped_offline: false })
    : create_failure_result(`${remaining.data} ${UNSYNCED_AFTER_FLUSH_SUFFIX}`);
}

export async function trigger_full_sync_on_page_reload(): Promise<void> {
  console.log("[BackgroundSync] Full sync triggered on page reload", {
    event: "page_reload_sync_triggered",
  });
  const succeeded = await sync_engine_runtime.request_run(SyncRunKind.FULL);
  console.log("[BackgroundSync] Page reload sync settled", {
    event: "page_reload_sync_settled",
    succeeded,
  });
}

export async function reset_local_sync_bookkeeping(): Promise<boolean> {
  sync_deferred_remote_changes.clear();
  return reset_sync_bookkeeping(get_database());
}

export function configure_scheduled_interval(
  interval_ms: number,
): Result<boolean> {
  const allowed = [...ALLOWED_SYNC_INTERVALS_MS] as number[];
  if (!allowed.includes(interval_ms)) {
    console.warn("[BackgroundSync] Rejected invalid sync interval", {
      event: "scheduled_interval_rejected",
      interval_ms,
    });
    return create_failure_result(
      `Invalid interval_ms: ${interval_ms}. Must be one of ${allowed.join(", ")}`,
    );
  }
  sync_engine_runtime.set_scheduled_interval(interval_ms);
  console.log("[BackgroundSync] Scheduled sync interval reconfigured", {
    event: "scheduled_interval_configured",
    interval_ms,
  });
  return create_success_result(true);
}
