import type { AsyncResult } from "$lib/core/types/Result";

import type { SyncEngineConfiguration } from "./syncEngineRunExecutor";
import {
  apply_engine_effect,
  dispatch_engine_event,
  refresh_outbox_summary_settled,
  refresh_runtime_outbox_summary,
} from "./syncEngineRuntimeCore";
import type {
  SyncEngineRuntimeContext,
  SyncEngineRuntimeDependencies,
} from "./syncEngineRuntimeTypes";
import { create_stopped_sync_engine } from "./syncEngineStateMachine";
import { create_engine_timer_slots } from "./syncEngineTimers";
import {
  SyncEngineEffectType,
  type SyncEngineEvent,
  SyncEngineEventType,
  type SyncEngineMachine,
  SyncEngineStatus,
  SyncRunKind,
  type SyncRunKindValue,
} from "./syncEngineTypes";
import {
  EMPTY_OUTBOX_SUMMARY,
  type OutboxSummary,
} from "./syncOutboxRepository";

export interface SyncEngineRuntime {
  dispatch(event: SyncEngineEvent): SyncEngineMachine;
  record_local_change(): SyncEngineMachine;
  request_run(run_kind: SyncRunKindValue): Promise<boolean>;
  refresh_outbox_summary(): AsyncResult<OutboxSummary>;
  get_machine(): SyncEngineMachine;
  get_outbox_summary(): OutboxSummary;
  get_configuration(): SyncEngineConfiguration;
  set_scheduled_interval(interval_ms: number): number;
  get_scheduled_interval_ms(): number;
}

const MINIMUM_PENDING_AFTER_LOCAL_CHANGE = 1;

function request_engine_run(
  context: SyncEngineRuntimeContext,
  run_kind: SyncRunKindValue,
): Promise<boolean> {
  const settled = new Promise<boolean>((resolve) =>
    context.settle_waiters.push(resolve),
  );
  dispatch_engine_event(context, {
    type:
      run_kind === SyncRunKind.PUSH
        ? SyncEngineEventType.PUSH_REQUESTED
        : SyncEngineEventType.FULL_SYNC_REQUESTED,
    next_run_id: context.dependencies.generate_run_id(),
  });
  if (context.machine.state.status !== SyncEngineStatus.SYNCING)
    apply_engine_effect(context, {
      type: SyncEngineEffectType.SETTLE_WAITERS,
      succeeded: false,
    });
  return settled;
}

function record_engine_local_change(
  context: SyncEngineRuntimeContext,
): SyncEngineMachine {
  context.outbox_summary = {
    ...context.outbox_summary,
    pending_count: Math.max(
      MINIMUM_PENDING_AFTER_LOCAL_CHANGE,
      context.outbox_summary.pending_count,
    ),
  };
  context.dependencies.on_local_change_recorded();
  void refresh_outbox_summary_settled(context);
  return dispatch_engine_event(context, {
    type: SyncEngineEventType.LOCAL_CHANGE_RECORDED,
  });
}

function change_scheduled_interval(
  context: SyncEngineRuntimeContext,
  interval_ms: number,
): number {
  context.scheduled_interval_ms = interval_ms;
  if (context.timer_slots.scheduled.is_running())
    context.timer_slots.scheduled.restart(interval_ms);
  return context.scheduled_interval_ms;
}

export function create_sync_engine_runtime(
  dependencies: SyncEngineRuntimeDependencies,
): SyncEngineRuntime {
  const context: SyncEngineRuntimeContext = {
    dependencies,
    timer_slots: create_engine_timer_slots(dependencies.timers),
    machine: create_stopped_sync_engine(true),
    outbox_summary: EMPTY_OUTBOX_SUMMARY,
    scheduled_interval_ms: dependencies.scheduled_interval_ms,
    settle_waiters: [],
  };
  return {
    dispatch: (event) => dispatch_engine_event(context, event),
    record_local_change: () => record_engine_local_change(context),
    request_run: (run_kind) => request_engine_run(context, run_kind),
    refresh_outbox_summary: () => refresh_runtime_outbox_summary(context),
    get_machine: () => context.machine,
    get_outbox_summary: () => context.outbox_summary,
    get_configuration: () => dependencies.configuration,
    set_scheduled_interval: (interval_ms) =>
      change_scheduled_interval(context, interval_ms),
    get_scheduled_interval_ms: () => context.scheduled_interval_ms,
  };
}
