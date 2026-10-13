import { type Option, OptionStatus } from "$lib/core/types/Option";

import {
  INITIAL_ATTEMPT,
  move,
  request_run,
  stay,
} from "./syncEngineTransitionHelpers";
import {
  SyncEngineEffectType,
  type SyncEngineEvent,
  SyncEngineEventType,
  type SyncEngineMachine,
  type SyncEngineState,
  SyncEngineStatus,
  type SyncEngineTransition,
  SyncRunKind,
} from "./syncEngineTypes";

type RetryWaitingState = Extract<
  SyncEngineState,
  {
    status:
      | typeof SyncEngineStatus.FAILED
      | typeof SyncEngineStatus.WAITING_TO_RETRY;
  }
>;

function read_attempt(retry_state: Option<RetryWaitingState>): number {
  if (retry_state.status === OptionStatus.NONE) return INITIAL_ATTEMPT;
  switch (retry_state.value.status) {
    case SyncEngineStatus.FAILED:
      return retry_state.value.attempt;
    case SyncEngineStatus.WAITING_TO_RETRY:
      return INITIAL_ATTEMPT;
  }
}

function retry_pending_run(
  machine: SyncEngineMachine,
  retry_state: Option<RetryWaitingState>,
  next_run_id: string,
  attempt: number,
): SyncEngineTransition {
  switch (retry_state.status) {
    case OptionStatus.SOME:
      return request_run(
        machine,
        retry_state.value.retry_run_kind,
        next_run_id,
        attempt,
      );
    case OptionStatus.NONE:
      return stay(machine);
  }
}

function cancel_retry_when_offline(
  machine: SyncEngineMachine,
  retry_state: Option<RetryWaitingState>,
): SyncEngineTransition {
  switch (retry_state.status) {
    case OptionStatus.SOME:
      return move(machine, { status: SyncEngineStatus.OFFLINE_WAITING }, [
        { type: SyncEngineEffectType.CANCEL_RETRY },
      ]);
    case OptionStatus.NONE:
      return stay(machine);
  }
}

export function handle_waiting(
  machine: SyncEngineMachine,
  event: SyncEngineEvent,
  retry_state: Option<RetryWaitingState>,
): SyncEngineTransition {
  const attempt = read_attempt(retry_state);
  switch (event.type) {
    case SyncEngineEventType.WENT_ONLINE:
      return request_run(machine, SyncRunKind.FULL, event.next_run_id, attempt);
    case SyncEngineEventType.RETRY_ELAPSED:
      return retry_pending_run(
        machine,
        retry_state,
        event.next_run_id,
        attempt,
      );
    case SyncEngineEventType.PUSH_REQUESTED:
      return request_run(machine, SyncRunKind.PUSH, event.next_run_id, attempt);
    case SyncEngineEventType.FULL_SYNC_REQUESTED:
      return request_run(machine, SyncRunKind.FULL, event.next_run_id, attempt);
    case SyncEngineEventType.WENT_OFFLINE:
      return cancel_retry_when_offline(machine, retry_state);
    case SyncEngineEventType.START:
    case SyncEngineEventType.STOP:
    case SyncEngineEventType.SUSPEND:
    case SyncEngineEventType.RESUME:
    case SyncEngineEventType.LOCAL_CHANGE_RECORDED:
    case SyncEngineEventType.DEBOUNCE_ELAPSED:
    case SyncEngineEventType.RUN_SUCCEEDED:
    case SyncEngineEventType.RUN_FAILED:
    case SyncEngineEventType.RUN_SKIPPED:
    case SyncEngineEventType.RUN_DEFERRED:
      return stay(machine);
  }
}
