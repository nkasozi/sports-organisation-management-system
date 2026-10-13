import { get } from "svelte/store";

import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import { get_database } from "$lib/adapters/repositories/database";
import { sync_local_change_notifier } from "$lib/adapters/repositories/syncOutbox/syncLocalChangeNotifier";

import { schedule_automatic_device_backup_write } from "../backup/storageBackupScheduler";
import {
  DEBOUNCE_DELAY_MS,
  DEFAULT_SCHEDULED_SYNC_INTERVAL_MS,
  sync_engine_configuration,
} from "./backgroundSyncSharedState";
import {
  create_sync_engine_runtime,
  type SyncEngineRuntime,
} from "./syncEngineRuntime";
import type { SyncEngineTimers } from "./syncEngineTimers";
import { summarize_outbox } from "./syncOutboxRepository";
import {
  sync_backfill_deferrals,
  sync_run_cancellation,
} from "./syncRunSignals";

const browser_timers: SyncEngineTimers = {
  set_timeout: (callback, delay_ms) => setTimeout(callback, delay_ms),
  clear_timeout: (handle) =>
    clearTimeout(handle as ReturnType<typeof setTimeout>),
  set_interval: (callback, interval_ms) => setInterval(callback, interval_ms),
  clear_interval: (handle) =>
    clearInterval(handle as ReturnType<typeof setInterval>),
};

export const sync_engine_runtime: SyncEngineRuntime =
  create_sync_engine_runtime({
    timers: browser_timers,
    now: () => Date.now(),
    generate_run_id: () => crypto.randomUUID(),
    is_signed_in: () => get(is_signed_in),
    summarize_outbox: () => summarize_outbox(get_database()),
    on_local_change_recorded: () => schedule_automatic_device_backup_write(),
    take_backfill_retry_after: () =>
      sync_backfill_deferrals.take_longest_retry_after(),
    cancel_active_runs: () => sync_run_cancellation.cancel_active_runs(),
    debounce_delay_ms: DEBOUNCE_DELAY_MS,
    scheduled_interval_ms: DEFAULT_SCHEDULED_SYNC_INTERVAL_MS,
    configuration: sync_engine_configuration,
  });

sync_local_change_notifier.set_listener(() => {
  sync_engine_runtime.record_local_change();
  return true;
});
