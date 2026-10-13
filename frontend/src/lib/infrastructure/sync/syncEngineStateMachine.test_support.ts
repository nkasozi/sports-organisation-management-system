import {
  create_stopped_sync_engine,
  transition_sync_engine,
} from "./syncEngineStateMachine";
import {
  type SyncEngineEvent,
  SyncEngineEventType as Event,
  type SyncEngineMachine,
} from "./syncEngineTypes";

export function run_events(
  machine: SyncEngineMachine,
  events: SyncEngineEvent[],
): SyncEngineMachine {
  return events.reduce(
    (current, event) => transition_sync_engine(current, event).machine,
    machine,
  );
}

export const started_online = run_events(create_stopped_sync_engine(true), [
  { type: Event.START, is_online: true },
]);

export function syncing_machine(): SyncEngineMachine {
  return run_events(started_online, [
    { type: Event.LOCAL_CHANGE_RECORDED },
    { type: Event.DEBOUNCE_ELAPSED, next_run_id: "run_1" },
  ]);
}
