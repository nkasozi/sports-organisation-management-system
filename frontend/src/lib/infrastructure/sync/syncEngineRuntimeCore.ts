import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { build_run_completion_event } from "./syncEngineRunEvents";
import { execute_sync_run } from "./syncEngineRunExecutor";
import type { SyncEngineRuntimeContext } from "./syncEngineRuntimeTypes";
import { transition_sync_engine } from "./syncEngineStateMachine";
import {
  type SyncEngineEffect,
  SyncEngineEffectType,
  type SyncEngineEvent,
  SyncEngineEventType,
  type SyncEngineMachine,
  SyncEngineStatus,
  type SyncRunKindValue,
} from "./syncEngineTypes";
import type { OutboxSummary } from "./syncOutboxRepository";

const NO_RUN_ID = "";
const MINIMUM_TIMER_DELAY_MS = 0;

export async function refresh_runtime_outbox_summary(
  context: SyncEngineRuntimeContext,
): AsyncResult<OutboxSummary> {
  try {
    context.outbox_summary = await context.dependencies.summarize_outbox();
    return create_success_result(context.outbox_summary);
  } catch (error) {
    console.error("[SyncEngine] Failed to summarize the outbox", {
      event: "sync_engine_outbox_summary_failed",
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

export async function refresh_outbox_summary_settled(
  context: SyncEngineRuntimeContext,
): Promise<boolean> {
  const refreshed = await refresh_runtime_outbox_summary(context);
  return refreshed.success;
}

async function run_and_report(
  context: SyncEngineRuntimeContext,
  run_id: string,
  run_kind: SyncRunKindValue,
): Promise<SyncEngineMachine> {
  const report = await execute_sync_run({
    run_id,
    run_kind,
    configuration: context.dependencies.configuration,
    is_signed_in: context.dependencies.is_signed_in(),
    take_backfill_retry_after: context.dependencies.take_backfill_retry_after,
  });
  await refresh_outbox_summary_settled(context);
  return dispatch_engine_event(
    context,
    build_run_completion_event(context, run_id, report),
  );
}

function schedule_event_after(
  context: SyncEngineRuntimeContext,
  slot: "debounce" | "retry",
  delay_ms: number,
  create_event: () => SyncEngineEvent,
): boolean {
  return context.timer_slots[slot].schedule(
    Math.max(MINIMUM_TIMER_DELAY_MS, delay_ms),
    () => dispatch_engine_event(context, create_event()),
  );
}

function settle_waiters(
  context: SyncEngineRuntimeContext,
  succeeded: boolean,
): boolean {
  const waiters = context.settle_waiters;
  context.settle_waiters = [];
  waiters.forEach((settle) => settle(succeeded));
  return true;
}

export function apply_engine_effect(
  context: SyncEngineRuntimeContext,
  effect: SyncEngineEffect,
): boolean {
  const generate_run_id = context.dependencies.generate_run_id;
  switch (effect.type) {
    case SyncEngineEffectType.SCHEDULE_DEBOUNCE:
      return schedule_event_after(
        context,
        "debounce",
        context.dependencies.debounce_delay_ms,
        () => ({
          type: SyncEngineEventType.DEBOUNCE_ELAPSED,
          next_run_id: generate_run_id(),
        }),
      );
    case SyncEngineEffectType.CANCEL_DEBOUNCE:
      return context.timer_slots.debounce.cancel();
    case SyncEngineEffectType.BEGIN_RUN:
      void run_and_report(context, effect.run_id, effect.run_kind);
      return true;
    case SyncEngineEffectType.SCHEDULE_RETRY:
      return schedule_event_after(
        context,
        "retry",
        effect.retry_at - context.dependencies.now(),
        () => ({
          type: SyncEngineEventType.RETRY_ELAPSED,
          next_run_id: generate_run_id(),
        }),
      );
    case SyncEngineEffectType.CANCEL_RETRY:
      return context.timer_slots.retry.cancel();
    case SyncEngineEffectType.CANCEL_RUN:
      return context.dependencies.cancel_active_runs() > 0;
    case SyncEngineEffectType.SETTLE_WAITERS:
      return settle_waiters(context, effect.succeeded);
  }
}

function sync_lifecycle_resources(
  context: SyncEngineRuntimeContext,
  previous: SyncEngineMachine,
): boolean {
  const was_stopped = previous.state.status === SyncEngineStatus.STOPPED;
  const is_stopped = context.machine.state.status === SyncEngineStatus.STOPPED;
  if (was_stopped && !is_stopped)
    return context.timer_slots.scheduled.start(
      context.scheduled_interval_ms,
      () =>
        dispatch_engine_event(context, {
          type: SyncEngineEventType.FULL_SYNC_REQUESTED,
          next_run_id: context.dependencies.generate_run_id(),
        }),
    );
  return !was_stopped && is_stopped
    ? context.timer_slots.scheduled.stop()
    : false;
}

function log_transition(
  previous: SyncEngineMachine,
  current: SyncEngineMachine,
  event: SyncEngineEvent,
): boolean {
  if (previous.state.status === current.state.status) return false;
  console.log("[SyncEngine] State transition", {
    event: "sync_engine_transition",
    trigger: event.type,
    from: previous.state.status,
    to: current.state.status,
    run_id:
      current.state.status === SyncEngineStatus.SYNCING
        ? current.state.run_id
        : NO_RUN_ID,
  });
  return true;
}

export function dispatch_engine_event(
  context: SyncEngineRuntimeContext,
  event: SyncEngineEvent,
): SyncEngineMachine {
  const previous = context.machine;
  const transition = transition_sync_engine(previous, event);
  context.machine = transition.machine;
  sync_lifecycle_resources(context, previous);
  log_transition(previous, context.machine, event);
  transition.effects.forEach((effect) => apply_engine_effect(context, effect));
  return context.machine;
}
