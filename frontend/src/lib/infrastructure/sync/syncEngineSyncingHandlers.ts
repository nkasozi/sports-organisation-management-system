import {
  calculate_retry_delay_ms,
  INITIAL_ATTEMPT,
  merge_follow_up,
  move,
  next_attempt,
  request_run,
  stay,
  type SyncingState,
} from "./syncEngineTransitionHelpers";
import {
  type SyncEngineEffect,
  SyncEngineEffectType,
  type SyncEngineEvent,
  SyncEngineEventType,
  type SyncEngineMachine,
  SyncEngineStatus,
  type SyncEngineTransition,
  SyncFollowUp,
  type SyncFollowUpValue,
  SyncRetryReason,
  SyncRunKind,
} from "./syncEngineTypes";

function finish_failed_run(
  machine: SyncEngineMachine,
  state: SyncingState,
  now: number,
): SyncEngineTransition {
  const settle: SyncEngineEffect = {
    type: SyncEngineEffectType.SETTLE_WAITERS,
    succeeded: false,
  };
  if (!machine.is_online)
    return move(machine, { status: SyncEngineStatus.OFFLINE_WAITING }, [
      settle,
    ]);
  const retry_at = now + calculate_retry_delay_ms(state.attempt);
  const retry_run_kind =
    state.follow_up === SyncFollowUp.FULL ? SyncRunKind.FULL : state.run_kind;
  return move(
    machine,
    {
      status: SyncEngineStatus.FAILED,
      retry_at,
      attempt: next_attempt(state.attempt),
      retry_run_kind,
    },
    [{ type: SyncEngineEffectType.SCHEDULE_RETRY, retry_at }, settle],
  );
}

function finish_successful_run(
  machine: SyncEngineMachine,
  state: SyncingState,
  next_run_id: string,
): SyncEngineTransition {
  switch (state.follow_up) {
    case SyncFollowUp.NONE:
      return move(machine, { status: SyncEngineStatus.IDLE }, [
        { type: SyncEngineEffectType.SETTLE_WAITERS, succeeded: true },
      ]);
    case SyncFollowUp.PUSH:
      return request_run(
        machine,
        SyncRunKind.PUSH,
        next_run_id,
        INITIAL_ATTEMPT,
      );
    case SyncFollowUp.FULL:
      return request_run(
        machine,
        SyncRunKind.FULL,
        next_run_id,
        INITIAL_ATTEMPT,
      );
  }
}

function defer_run(
  machine: SyncEngineMachine,
  state: SyncingState,
  event: Extract<
    SyncEngineEvent,
    { type: typeof SyncEngineEventType.RUN_DEFERRED }
  >,
): SyncEngineTransition {
  const is_backfill = event.reason === SyncRetryReason.SERVER_BACKFILL;
  const retry_run_kind =
    is_backfill || state.follow_up === SyncFollowUp.FULL
      ? SyncRunKind.FULL
      : state.run_kind;
  return move(
    machine,
    {
      status: SyncEngineStatus.WAITING_TO_RETRY,
      reason: event.reason,
      retry_at: event.retry_at,
      retry_run_kind,
    },
    [
      { type: SyncEngineEffectType.SCHEDULE_RETRY, retry_at: event.retry_at },
      { type: SyncEngineEffectType.SETTLE_WAITERS, succeeded: is_backfill },
    ],
  );
}

function skip_run(machine: SyncEngineMachine): SyncEngineTransition {
  return move(machine, { status: SyncEngineStatus.IDLE }, [
    { type: SyncEngineEffectType.SETTLE_WAITERS, succeeded: false },
  ]);
}

type RunSettlementEvent = Extract<
  SyncEngineEvent,
  {
    type:
      | typeof SyncEngineEventType.RUN_SUCCEEDED
      | typeof SyncEngineEventType.RUN_FAILED
      | typeof SyncEngineEventType.RUN_DEFERRED
      | typeof SyncEngineEventType.RUN_SKIPPED;
  }
>;

function settle_run(
  machine: SyncEngineMachine,
  state: SyncingState,
  event: RunSettlementEvent,
): SyncEngineTransition {
  if (event.run_id !== state.run_id) return stay(machine);
  switch (event.type) {
    case SyncEngineEventType.RUN_SUCCEEDED:
      return finish_successful_run(machine, state, event.next_run_id);
    case SyncEngineEventType.RUN_FAILED:
      return finish_failed_run(machine, state, event.now);
    case SyncEngineEventType.RUN_DEFERRED:
      return defer_run(machine, state, event);
    case SyncEngineEventType.RUN_SKIPPED:
      return skip_run(machine);
  }
}

function queue_follow_up(
  machine: SyncEngineMachine,
  state: SyncingState,
  requested: SyncFollowUpValue,
): SyncEngineTransition {
  return move(
    machine,
    { ...state, follow_up: merge_follow_up(state.follow_up, requested) },
    [],
  );
}

export function handle_syncing(
  machine: SyncEngineMachine,
  state: SyncingState,
  event: SyncEngineEvent,
): SyncEngineTransition {
  switch (event.type) {
    case SyncEngineEventType.LOCAL_CHANGE_RECORDED:
    case SyncEngineEventType.PUSH_REQUESTED:
      return queue_follow_up(machine, state, SyncFollowUp.PUSH);
    case SyncEngineEventType.FULL_SYNC_REQUESTED:
      return queue_follow_up(machine, state, SyncFollowUp.FULL);
    case SyncEngineEventType.RUN_SUCCEEDED:
    case SyncEngineEventType.RUN_FAILED:
    case SyncEngineEventType.RUN_DEFERRED:
    case SyncEngineEventType.RUN_SKIPPED:
      return settle_run(machine, state, event);
    case SyncEngineEventType.START:
    case SyncEngineEventType.STOP:
    case SyncEngineEventType.SUSPEND:
    case SyncEngineEventType.RESUME:
    case SyncEngineEventType.DEBOUNCE_ELAPSED:
    case SyncEngineEventType.RETRY_ELAPSED:
    case SyncEngineEventType.WENT_ONLINE:
    case SyncEngineEventType.WENT_OFFLINE:
      return stay(machine);
  }
}
