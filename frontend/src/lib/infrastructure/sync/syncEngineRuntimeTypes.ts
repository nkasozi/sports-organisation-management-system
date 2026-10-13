import type { Option } from "$lib/core/types/Option";

import type { SyncEngineConfiguration } from "./syncEngineRunExecutor";
import type { EngineTimerSlots, SyncEngineTimers } from "./syncEngineTimers";
import type { SyncEngineMachine } from "./syncEngineTypes";
import type { OutboxSummary } from "./syncOutboxRepository";

export interface SyncEngineRuntimeDependencies {
  timers: SyncEngineTimers;
  now(): number;
  generate_run_id(): string;
  is_signed_in(): boolean;
  summarize_outbox(): Promise<OutboxSummary>;
  on_local_change_recorded(): boolean;
  take_backfill_retry_after(): Option<number>;
  cancel_active_runs(): number;
  debounce_delay_ms: number;
  scheduled_interval_ms: number;
  configuration: SyncEngineConfiguration;
}

export interface SyncEngineRuntimeContext {
  dependencies: SyncEngineRuntimeDependencies;
  timer_slots: EngineTimerSlots;
  machine: SyncEngineMachine;
  outbox_summary: OutboxSummary;
  scheduled_interval_ms: number;
  settle_waiters: Array<(succeeded: boolean) => unknown>;
}
