import {
  SYNC_RETRY_BASE_DELAY_MS,
  SYNC_RETRY_MAX_DELAY_MS,
  type SyncEngineEffect,
  SyncEngineEffectType,
  type SyncEngineMachine,
  type SyncEngineState,
  SyncEngineStatus,
  type SyncEngineTransition,
  SyncFollowUp,
  type SyncFollowUpValue,
  type SyncRunKindValue,
} from "./syncEngineTypes";

export type SyncingState = Extract<
  SyncEngineState,
  { status: typeof SyncEngineStatus.SYNCING }
>;

export const INITIAL_ATTEMPT = 0;
const NEXT_ATTEMPT_INCREMENT = 1;
const RETRY_GROWTH_FACTOR = 2;
const FOLLOW_UP_PRIORITY: Record<SyncFollowUpValue, number> = {
  [SyncFollowUp.NONE]: 0,
  [SyncFollowUp.PUSH]: 1,
  [SyncFollowUp.FULL]: 2,
};

export function next_attempt(attempt: number): number {
  return attempt + NEXT_ATTEMPT_INCREMENT;
}

export function stay(machine: SyncEngineMachine): SyncEngineTransition {
  return { machine, effects: [] };
}

export function move(
  machine: SyncEngineMachine,
  state: SyncEngineState,
  effects: SyncEngineEffect[],
): SyncEngineTransition {
  return { machine: { ...machine, state }, effects };
}

export function calculate_retry_delay_ms(attempt: number): number {
  return Math.min(
    SYNC_RETRY_BASE_DELAY_MS * RETRY_GROWTH_FACTOR ** attempt,
    SYNC_RETRY_MAX_DELAY_MS,
  );
}

export function merge_follow_up(
  current: SyncFollowUpValue,
  requested: SyncFollowUpValue,
): SyncFollowUpValue {
  return FOLLOW_UP_PRIORITY[requested] > FOLLOW_UP_PRIORITY[current]
    ? requested
    : current;
}

export function request_run(
  machine: SyncEngineMachine,
  run_kind: SyncRunKindValue,
  run_id: string,
  attempt: number,
): SyncEngineTransition {
  const cancel_timers: SyncEngineEffect[] = [
    { type: SyncEngineEffectType.CANCEL_DEBOUNCE },
    { type: SyncEngineEffectType.CANCEL_RETRY },
  ];
  if (!machine.is_online)
    return move(
      machine,
      { status: SyncEngineStatus.OFFLINE_WAITING },
      cancel_timers,
    );
  return move(
    machine,
    {
      status: SyncEngineStatus.SYNCING,
      run_id,
      run_kind,
      follow_up: SyncFollowUp.NONE,
      attempt,
    },
    [
      ...cancel_timers,
      { type: SyncEngineEffectType.BEGIN_RUN, run_id, run_kind },
    ],
  );
}
