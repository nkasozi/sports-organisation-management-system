import {
  classify_lifecycle_event,
  LifecycleCommandKind,
  requested_follow_up,
} from "./syncEngineEventClassification";
import { merge_follow_up, move, stay } from "./syncEngineTransitionHelpers";
import {
  SyncEngineEffectType,
  type SyncEngineEvent,
  type SyncEngineMachine,
  type SyncEngineState,
  SyncEngineStatus,
  type SyncEngineTransition,
  SyncFollowUp,
  type SyncFollowUpValue,
  type SyncRunKindValue,
} from "./syncEngineTypes";

type HaltedStatus =
  | typeof SyncEngineStatus.STOPPED
  | typeof SyncEngineStatus.SUSPENDED;

type HaltedState = Extract<SyncEngineState, { status: HaltedStatus }>;

function follow_up_for_run_kind(run_kind: SyncRunKindValue): SyncFollowUpValue {
  return run_kind;
}

function describe_unfinished_work(state: SyncEngineState): SyncFollowUpValue {
  switch (state.status) {
    case SyncEngineStatus.STOPPED:
    case SyncEngineStatus.SUSPENDED:
      return state.queued_follow_up;
    case SyncEngineStatus.SYNCING:
      return merge_follow_up(
        follow_up_for_run_kind(state.run_kind),
        state.follow_up,
      );
    case SyncEngineStatus.FAILED:
    case SyncEngineStatus.WAITING_TO_RETRY:
      return follow_up_for_run_kind(state.retry_run_kind);
    case SyncEngineStatus.DEBOUNCING:
    case SyncEngineStatus.OFFLINE_WAITING:
      return SyncFollowUp.PUSH;
    case SyncEngineStatus.IDLE:
      return SyncFollowUp.NONE;
  }
}

export function enter_halted_state(
  machine: SyncEngineMachine,
  status: HaltedStatus,
): SyncEngineTransition {
  return move(
    machine,
    { status, queued_follow_up: describe_unfinished_work(machine.state) },
    [
      { type: SyncEngineEffectType.CANCEL_DEBOUNCE },
      { type: SyncEngineEffectType.CANCEL_RETRY },
      { type: SyncEngineEffectType.CANCEL_RUN },
      { type: SyncEngineEffectType.SETTLE_WAITERS, succeeded: false },
    ],
  );
}

function resume_from_halt(
  machine: SyncEngineMachine,
  queued_follow_up: SyncFollowUpValue,
): SyncEngineTransition {
  switch (queued_follow_up) {
    case SyncFollowUp.NONE:
      return move(machine, { status: SyncEngineStatus.IDLE }, []);
    case SyncFollowUp.PUSH:
    case SyncFollowUp.FULL:
      return resume_pending_work(machine);
  }
}

function resume_pending_work(machine: SyncEngineMachine): SyncEngineTransition {
  return machine.is_online
    ? move(machine, { status: SyncEngineStatus.DEBOUNCING }, [
        { type: SyncEngineEffectType.SCHEDULE_DEBOUNCE },
      ])
    : move(machine, { status: SyncEngineStatus.OFFLINE_WAITING }, []);
}

function queue_work_while_halted(
  machine: SyncEngineMachine,
  status: HaltedStatus,
  queued_follow_up: SyncFollowUpValue,
  event: SyncEngineEvent,
): SyncEngineTransition {
  const next_follow_up = merge_follow_up(
    queued_follow_up,
    requested_follow_up(event),
  );
  return next_follow_up === queued_follow_up
    ? stay(machine)
    : move(machine, { status, queued_follow_up: next_follow_up }, []);
}

function resume_only_when_suspended(
  machine: SyncEngineMachine,
  state: HaltedState,
): SyncEngineTransition {
  switch (state.status) {
    case SyncEngineStatus.SUSPENDED:
      return resume_from_halt(machine, state.queued_follow_up);
    case SyncEngineStatus.STOPPED:
      return stay(machine);
  }
}

function stop_while_halted(
  machine: SyncEngineMachine,
  state: HaltedState,
): SyncEngineTransition {
  switch (state.status) {
    case SyncEngineStatus.SUSPENDED:
      return move(
        machine,
        {
          status: SyncEngineStatus.STOPPED,
          queued_follow_up: state.queued_follow_up,
        },
        [],
      );
    case SyncEngineStatus.STOPPED:
      return stay(machine);
  }
}

export function handle_event_while_halted(
  machine: SyncEngineMachine,
  state: HaltedState,
  event: SyncEngineEvent,
): SyncEngineTransition {
  const command = classify_lifecycle_event(event);
  switch (command.kind) {
    case LifecycleCommandKind.START:
      return resume_from_halt(
        { ...machine, is_online: command.is_online },
        state.queued_follow_up,
      );
    case LifecycleCommandKind.RESUME:
      return resume_only_when_suspended(machine, state);
    case LifecycleCommandKind.STOP:
      return stop_while_halted(machine, state);
    case LifecycleCommandKind.SUSPEND:
      return stay(machine);
    case LifecycleCommandKind.NONE:
      return queue_work_while_halted(
        machine,
        state.status,
        state.queued_follow_up,
        event,
      );
  }
}
