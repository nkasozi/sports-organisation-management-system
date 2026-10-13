import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

import {
  classify_lifecycle_event,
  LifecycleCommandKind,
  read_connectivity_change,
} from "./syncEngineEventClassification";
import {
  enter_halted_state,
  handle_event_while_halted,
} from "./syncEngineHaltedHandlers";
import { handle_idle_or_debouncing } from "./syncEngineStateHandlers";
import { handle_syncing } from "./syncEngineSyncingHandlers";
import { stay } from "./syncEngineTransitionHelpers";
import {
  type SyncEngineEvent,
  type SyncEngineMachine,
  SyncEngineStatus,
  type SyncEngineTransition,
  SyncFollowUp,
} from "./syncEngineTypes";
import { handle_waiting } from "./syncEngineWaitingHandlers";

export { calculate_retry_delay_ms } from "./syncEngineTransitionHelpers";

function handle_running_lifecycle_event(
  machine: SyncEngineMachine,
  event: SyncEngineEvent,
): Option<SyncEngineTransition> {
  const command = classify_lifecycle_event(event);
  switch (command.kind) {
    case LifecycleCommandKind.START:
    case LifecycleCommandKind.RESUME:
      return create_some_option(stay(machine));
    case LifecycleCommandKind.STOP:
      return create_some_option(
        enter_halted_state(machine, SyncEngineStatus.STOPPED),
      );
    case LifecycleCommandKind.SUSPEND:
      return create_some_option(
        enter_halted_state(machine, SyncEngineStatus.SUSPENDED),
      );
    case LifecycleCommandKind.NONE:
      return create_none_option();
  }
}

function handle_work_event(
  machine: SyncEngineMachine,
  event: SyncEngineEvent,
): SyncEngineTransition {
  const state = machine.state;
  switch (state.status) {
    case SyncEngineStatus.IDLE:
    case SyncEngineStatus.DEBOUNCING:
      return handle_idle_or_debouncing(machine, event);
    case SyncEngineStatus.SYNCING:
      return handle_syncing(machine, state, event);
    case SyncEngineStatus.FAILED:
    case SyncEngineStatus.WAITING_TO_RETRY:
      return handle_waiting(machine, event, create_some_option(state));
    case SyncEngineStatus.OFFLINE_WAITING:
      return handle_waiting(machine, event, create_none_option());
    case SyncEngineStatus.STOPPED:
    case SyncEngineStatus.SUSPENDED:
      return handle_event_while_halted(machine, state, event);
  }
}

function handle_running_event(
  machine: SyncEngineMachine,
  event: SyncEngineEvent,
): SyncEngineTransition {
  const lifecycle_transition = handle_running_lifecycle_event(machine, event);
  switch (lifecycle_transition.status) {
    case OptionStatus.SOME:
      return lifecycle_transition.value;
    case OptionStatus.NONE:
      return handle_work_event(machine, event);
  }
}

export function transition_sync_engine(
  current_machine: SyncEngineMachine,
  event: SyncEngineEvent,
): SyncEngineTransition {
  const machine: SyncEngineMachine = {
    ...current_machine,
    is_online: read_connectivity_change(event, current_machine.is_online),
  };
  const state = machine.state;
  switch (state.status) {
    case SyncEngineStatus.STOPPED:
    case SyncEngineStatus.SUSPENDED:
      return handle_event_while_halted(machine, state, event);
    case SyncEngineStatus.IDLE:
    case SyncEngineStatus.DEBOUNCING:
    case SyncEngineStatus.SYNCING:
    case SyncEngineStatus.FAILED:
    case SyncEngineStatus.WAITING_TO_RETRY:
    case SyncEngineStatus.OFFLINE_WAITING:
      return handle_running_event(machine, event);
  }
}

export function create_stopped_sync_engine(
  is_online: boolean,
): SyncEngineMachine {
  return {
    state: {
      status: SyncEngineStatus.STOPPED,
      queued_follow_up: SyncFollowUp.NONE,
    },
    is_online,
  };
}
