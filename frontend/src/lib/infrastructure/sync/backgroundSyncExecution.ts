import { get } from "svelte/store";

import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";

import {
  DEBOUNCE_DELAY_MS,
  OFFLINE_RETRY_INTERVAL_MS,
  sync_deps,
  sync_state,
} from "./backgroundSyncSharedState";

export function cancel_pending_debounce(): void {
  if (sync_state.debounce_timer_id === null) return;
  clearTimeout(sync_state.debounce_timer_id);
  sync_state.debounce_timer_id = null;
}

export function trigger_debounced_sync(): void {
  cancel_pending_debounce();
  sync_state.debounce_timer_id = setTimeout(() => {
    sync_state.debounce_timer_id = null;
    execute_push_sync();
  }, DEBOUNCE_DELAY_MS);
}

export async function execute_push_sync(): Promise<boolean> {
  if (!get(is_signed_in)) {
    console.log("[BackgroundSync] User not signed in — skipping sync");
    return false;
  }
  if (!sync_state.is_online) {
    sync_state.has_pending_changes = true;
    return false;
  }
  if (!sync_deps.orchestrator) {
    console.warn("[BackgroundSync] No orchestrator — skipping sync");
    return false;
  }

  const timestamp_cache =
    sync_deps.remote_subscriber?.get_cached_table_timestamps();
  console.log("[BackgroundSync] Executing push-only sync...");
  const result = await sync_deps.orchestrator.sync_now("push", {
    remote_timestamp_cache: timestamp_cache,
  });

  if (result.success) {
    sync_state.has_pending_changes = false;
    console.log(
      `[BackgroundSync] Push sync completed — pushed: ${result.data.records_pushed}`,
    );
    return true;
  }
  sync_state.has_pending_changes = true;
  console.warn("[BackgroundSync] Push sync failed:", result.error.message);
  return false;
}

export async function run_network_restoration_sync(
  sync_trigger: "scheduled" | "page_reload" | "network_restoration",
): Promise<void> {
  if (!get(is_signed_in)) {
    console.log("[BackgroundSync] Not signed in — skipping restoration sync", {
      event: "restoration_sync_skipped",
      sync_trigger,
    });
    return;
  }
  if (!sync_deps.orchestrator) {
    console.warn(
      "[BackgroundSync] No orchestrator — skipping restoration sync",
      { event: "restoration_sync_skipped_no_orchestrator", sync_trigger },
    );
    if (sync_state.has_pending_changes) {
      trigger_debounced_sync();
    }
    return;
  }
  if (sync_state.is_restoration_sync_in_progress) {
    console.log("[BackgroundSync] Restoration sync already in progress", {
      event: "restoration_sync_skipped_in_progress",
      sync_trigger,
    });
    return;
  }

  sync_state.is_restoration_sync_in_progress = true;
  console.log("[BackgroundSync] Starting full bidirectional sync", {
    event: "restoration_sync_started",
    sync_trigger,
  });
  const websocket_was_running =
    sync_deps.remote_subscriber?.is_running() ?? false;

  if (websocket_was_running) {
    console.log("[BackgroundSync] Pausing WebSocket subscriptions", {
      event: "websocket_paused_for_sync",
      sync_trigger,
    });
    sync_deps.restoration_handlers?.stop_remote_sync();
  }

  try {
    const result = await sync_deps.orchestrator.sync_now("bidirectional", {
      use_fresh_timestamps: true,
    });
    if (result.success) {
      sync_state.has_pending_changes = false;
      console.log("[BackgroundSync] Full bidirectional sync completed", {
        event: "restoration_sync_completed",
        sync_trigger,
        records_pushed: result.data.records_pushed,
        records_pulled: result.data.records_pulled,
      });
    } else {
      console.warn("[BackgroundSync] Full bidirectional sync failed", {
        event: "restoration_sync_failed",
        sync_trigger,
        error: result.error.message,
      });
    }
  } finally {
    if (websocket_was_running) {
      console.log("[BackgroundSync] Resuming WebSocket subscriptions", {
        event: "websocket_resumed_after_sync",
        sync_trigger,
      });
      sync_deps.restoration_handlers?.start_remote_sync();
    }
    sync_state.is_restoration_sync_in_progress = false;
  }
}

export function start_offline_retry_timer(): void {
  if (sync_state.offline_retry_timer_id !== null) return;
  sync_state.offline_retry_timer_id = setInterval(() => {
    if (!sync_state.has_pending_changes) return;
    if (sync_state.is_online) {
      console.log(
        "[BackgroundSync] Back online during retry — syncing pending changes",
      );
      run_network_restoration_sync("network_restoration");
      stop_offline_retry_timer();
      return;
    }
    console.log(
      "[BackgroundSync] Still offline with pending changes — will retry",
    );
  }, OFFLINE_RETRY_INTERVAL_MS);
}

export function stop_offline_retry_timer(): void {
  if (sync_state.offline_retry_timer_id === null) return;
  clearInterval(sync_state.offline_retry_timer_id);
  sync_state.offline_retry_timer_id = null;
}

export function start_scheduled_sync_timer(): void {
  if (sync_state.scheduled_sync_timer_id !== null) return;
  console.log("[BackgroundSync] Starting scheduled sync timer", {
    event: "scheduled_sync_timer_started",
    interval_ms: sync_state.active_interval_ms,
  });
  sync_state.scheduled_sync_timer_id = setInterval(() => {
    console.log("[BackgroundSync] Scheduled sync triggered", {
      event: "scheduled_sync_triggered",
      timestamp: new Date().toISOString(),
    });
    run_network_restoration_sync("scheduled");
  }, sync_state.active_interval_ms);
}

export function stop_scheduled_sync_timer(): void {
  if (sync_state.scheduled_sync_timer_id === null) return;
  clearInterval(sync_state.scheduled_sync_timer_id);
  sync_state.scheduled_sync_timer_id = null;
  console.log("[BackgroundSync] Scheduled sync timer stopped", {
    event: "scheduled_sync_timer_stopped",
  });
}
