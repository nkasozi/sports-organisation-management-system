import { get } from "svelte/store";

import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import { get_database } from "$lib/adapters/repositories/database";
import { ALLOWED_SYNC_INTERVALS_MS } from "$lib/core/entities/OrganizationSettings";
import type {
  LocalChangePublisherPort,
  LocalSyncStatus,
  RemoteChangeSubscriberPort,
  SyncOrchestratorPort,
  SyncRestorationHandlers,
} from "$lib/core/interfaces/ports";
import type { AsyncResult, Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { install_dexie_hooks } from "./backgroundSyncDexieHooks";
import {
  cancel_pending_debounce,
  execute_push_sync,
  run_network_restoration_sync,
  start_offline_retry_timer,
  start_scheduled_sync_timer,
  stop_offline_retry_timer,
  stop_scheduled_sync_timer,
  trigger_debounced_sync,
} from "./backgroundSyncExecution";
import {
  reset_sync_state,
  sync_deps,
  sync_state,
} from "./backgroundSyncSharedState";
import { get_pulling_from_remote, set_pulling_from_remote } from "./syncState";

export { set_pulling_from_remote };

export function configure_orchestrator(
  sync_orchestrator: SyncOrchestratorPort,
): Result<boolean> {
  sync_deps.orchestrator = sync_orchestrator;
  console.log("[BackgroundSync] Orchestrator configured");
  return create_success_result(true);
}

export function configure_restoration_handlers(
  handlers: SyncRestorationHandlers,
): Result<boolean> {
  sync_deps.restoration_handlers = handlers;
  console.log("[BackgroundSync] Restoration handlers configured");
  return create_success_result(true);
}

export function configure_remote_subscriber(
  subscriber: RemoteChangeSubscriberPort,
): Result<boolean> {
  sync_deps.remote_subscriber = subscriber;
  console.log("[BackgroundSync] Remote subscriber configured");
  return create_success_result(true);
}

function handle_online_event(): void {
  sync_state.is_online = true;
  console.log("[BackgroundSync] Device came online");
  stop_offline_retry_timer();
  run_network_restoration_sync("network_restoration");
}

function handle_offline_event(): void {
  sync_state.is_online = false;
  console.log("[BackgroundSync] Device went offline");
  cancel_pending_debounce();
  start_offline_retry_timer();
}

function on_local_write(table_name: string): void {
  if (get_pulling_from_remote()) return;
  if (!get(is_signed_in)) return;
  console.log(`[BackgroundSync] Dexie write detected on table: ${table_name}`);
  sync_state.has_pending_changes = true;
  trigger_debounced_sync();
}

export function start_background_sync(): boolean {
  if (typeof window === "undefined") return false;
  if (sync_state.is_running) return false;
  if (!sync_state.hooks_installed) {
    sync_state.hooks_installed = install_dexie_hooks(
      get_database(),
      on_local_write,
    );
  }
  window.addEventListener("online", handle_online_event);
  window.addEventListener("offline", handle_offline_event);
  sync_state.is_running = true;
  sync_state.is_online = navigator.onLine;
  start_scheduled_sync_timer();
  console.log("[BackgroundSync] Started — listening for Dexie database writes");
  if (!get(is_signed_in)) {
    console.log(
      "[BackgroundSync] Started without active session — sync deferred until sign-in",
    );
  }
  return true;
}

export function stop_background_sync(): boolean {
  if (!sync_state.is_running) return false;
  cancel_pending_debounce();
  stop_offline_retry_timer();
  stop_scheduled_sync_timer();
  if (typeof window !== "undefined") {
    window.removeEventListener("online", handle_online_event);
    window.removeEventListener("offline", handle_offline_event);
  }
  reset_sync_state();
  console.log("[BackgroundSync] Stopped");
  return true;
}

export function get_background_sync_status(): {
  is_running: boolean;
  has_pending_changes: boolean;
  is_online: boolean;
} {
  return {
    is_running: sync_state.is_running,
    has_pending_changes: sync_state.has_pending_changes,
    is_online: sync_state.is_online,
  };
}

export function has_pending_unsynced_changes(): boolean {
  return sync_state.has_pending_changes;
}

export async function flush_pending_changes(): AsyncResult<{
  skipped_offline: boolean;
}> {
  if (!sync_state.has_pending_changes)
    return create_success_result({ skipped_offline: false });
  if (!sync_state.is_online) {
    console.log("[BackgroundSync] Cannot flush changes while offline");
    return create_success_result({ skipped_offline: true });
  }
  cancel_pending_debounce();
  const sync_succeeded = await execute_push_sync();
  return sync_succeeded
    ? create_success_result({ skipped_offline: false })
    : create_failure_result("Flush failed — check logs for push sync errors");
}

export async function trigger_full_sync_on_page_reload(): Promise<void> {
  console.log("[BackgroundSync] Full sync triggered on page reload", {
    event: "page_reload_sync_triggered",
    timestamp: new Date().toISOString(),
  });
  await run_network_restoration_sync("page_reload");
}

export function configure_scheduled_interval(
  interval_ms: number,
): Result<boolean> {
  const allowed = [...ALLOWED_SYNC_INTERVALS_MS] as number[];
  if (!allowed.includes(interval_ms)) {
    console.warn("[BackgroundSync] Rejected invalid sync interval", {
      event: "scheduled_interval_rejected",
      interval_ms,
      allowed_values: allowed,
    });
    return create_failure_result(
      `Invalid interval_ms: ${interval_ms}. Must be one of ${allowed.join(", ")}`,
    );
  }
  sync_state.active_interval_ms = interval_ms;
  stop_scheduled_sync_timer();
  start_scheduled_sync_timer();
  console.log("[BackgroundSync] Scheduled sync interval reconfigured", {
    event: "scheduled_interval_configured",
    interval_ms,
  });
  return create_success_result(true);
}

function create_local_change_publisher(): LocalChangePublisherPort {
  return {
    start: () =>
      start_background_sync()
        ? create_success_result(true)
        : create_failure_result(
            "Background sync already running or not in browser",
          ),
    stop: () =>
      stop_background_sync()
        ? create_success_result(true)
        : create_failure_result("Background sync was not running"),
    get_status: (): LocalSyncStatus => ({
      is_running: sync_state.is_running,
      has_pending_changes: sync_state.has_pending_changes,
      is_online: sync_state.is_online,
    }),
    set_remote_sync_in_progress: (value: boolean) => (
      set_pulling_from_remote(value),
      create_success_result(true)
    ),
    configure_orchestrator: (orch: SyncOrchestratorPort) =>
      configure_orchestrator(orch),
    configure_restoration_handlers: (handlers: SyncRestorationHandlers) =>
      configure_restoration_handlers(handlers),
    has_pending_changes: () => sync_state.has_pending_changes,
    flush_pending_changes,
  };
}
