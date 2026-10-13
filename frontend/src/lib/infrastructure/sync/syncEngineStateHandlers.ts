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
  SyncEngineStatus,
  type SyncEngineTransition,
  SyncRunKind,
  type SyncRunKindValue,
} from "./syncEngineTypes";

function record_local_change(machine: SyncEngineMachine): SyncEngineTransition {
  return machine.is_online
    ? move(machine, { status: SyncEngineStatus.DEBOUNCING }, [
        { type: SyncEngineEffectType.SCHEDULE_DEBOUNCE },
      ])
    : move(machine, { status: SyncEngineStatus.OFFLINE_WAITING }, []);
}

function cancel_debounce_when_offline(
  machine: SyncEngineMachine,
  is_debouncing: boolean,
): SyncEngineTransition {
  return is_debouncing
    ? move(machine, { status: SyncEngineStatus.OFFLINE_WAITING }, [
        { type: SyncEngineEffectType.CANCEL_DEBOUNCE },
      ])
    : stay(machine);
}

function start_initial_run(
  machine: SyncEngineMachine,
  run_kind: SyncRunKindValue,
  next_run_id: string,
): SyncEngineTransition {
  return request_run(machine, run_kind, next_run_id, INITIAL_ATTEMPT);
}

export function handle_idle_or_debouncing(
  machine: SyncEngineMachine,
  event: SyncEngineEvent,
): SyncEngineTransition {
  const is_debouncing = machine.state.status === SyncEngineStatus.DEBOUNCING;
  switch (event.type) {
    case SyncEngineEventType.LOCAL_CHANGE_RECORDED:
      return record_local_change(machine);
    case SyncEngineEventType.DEBOUNCE_ELAPSED:
      return is_debouncing
        ? start_initial_run(machine, SyncRunKind.PUSH, event.next_run_id)
        : stay(machine);
    case SyncEngineEventType.PUSH_REQUESTED:
      return start_initial_run(machine, SyncRunKind.PUSH, event.next_run_id);
    case SyncEngineEventType.FULL_SYNC_REQUESTED:
      return start_initial_run(machine, SyncRunKind.FULL, event.next_run_id);
    case SyncEngineEventType.WENT_OFFLINE:
      return cancel_debounce_when_offline(machine, is_debouncing);
    case SyncEngineEventType.START:
    case SyncEngineEventType.STOP:
    case SyncEngineEventType.SUSPEND:
    case SyncEngineEventType.RESUME:
    case SyncEngineEventType.RUN_SUCCEEDED:
    case SyncEngineEventType.RUN_FAILED:
    case SyncEngineEventType.RUN_SKIPPED:
    case SyncEngineEventType.RUN_DEFERRED:
    case SyncEngineEventType.RETRY_ELAPSED:
    case SyncEngineEventType.WENT_ONLINE:
      return stay(machine);
  }
}
