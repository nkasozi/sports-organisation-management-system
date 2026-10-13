export interface SyncEngineTimers {
  set_timeout(callback: () => unknown, delay_ms: number): unknown;
  clear_timeout(handle: unknown): unknown;
  set_interval(callback: () => unknown, interval_ms: number): unknown;
  clear_interval(handle: unknown): unknown;
}

type TimerSlotState =
  | { status: "idle" }
  | { status: "scheduled"; handle: unknown };

const TimerSlotStatus = {
  IDLE: "idle",
  SCHEDULED: "scheduled",
} as const;

export interface OneShotTimerSlot {
  schedule(delay_ms: number, callback: () => unknown): boolean;
  cancel(): boolean;
}

export interface IntervalTimerSlot {
  start(interval_ms: number, callback: () => unknown): boolean;
  restart(interval_ms: number): boolean;
  stop(): boolean;
  is_running(): boolean;
}

export interface EngineTimerSlots {
  debounce: OneShotTimerSlot;
  retry: OneShotTimerSlot;
  scheduled: IntervalTimerSlot;
}

function create_one_shot_slot(timers: SyncEngineTimers): OneShotTimerSlot {
  let slot: TimerSlotState = { status: TimerSlotStatus.IDLE };
  const cancel = (): boolean => {
    if (slot.status !== TimerSlotStatus.SCHEDULED) return false;
    timers.clear_timeout(slot.handle);
    slot = { status: TimerSlotStatus.IDLE };
    return true;
  };
  return {
    cancel,
    schedule: (delay_ms: number, callback: () => unknown): boolean => {
      cancel();
      slot = {
        status: TimerSlotStatus.SCHEDULED,
        handle: timers.set_timeout(() => {
          slot = { status: TimerSlotStatus.IDLE };
          callback();
        }, delay_ms),
      };
      return true;
    },
  };
}

function create_interval_slot(timers: SyncEngineTimers): IntervalTimerSlot {
  let slot: TimerSlotState = { status: TimerSlotStatus.IDLE };
  let current_callback: () => unknown = (): boolean => false;
  const stop = (): boolean => {
    if (slot.status !== TimerSlotStatus.SCHEDULED) return false;
    timers.clear_interval(slot.handle);
    slot = { status: TimerSlotStatus.IDLE };
    return true;
  };
  const start = (interval_ms: number, callback: () => unknown): boolean => {
    stop();
    current_callback = callback;
    slot = {
      status: TimerSlotStatus.SCHEDULED,
      handle: timers.set_interval(callback, interval_ms),
    };
    return true;
  };
  return {
    start,
    stop,
    restart: (interval_ms: number): boolean =>
      start(interval_ms, current_callback),
    is_running: (): boolean => slot.status === TimerSlotStatus.SCHEDULED,
  };
}

export function create_engine_timer_slots(
  timers: SyncEngineTimers,
): EngineTimerSlots {
  return {
    debounce: create_one_shot_slot(timers),
    retry: create_one_shot_slot(timers),
    scheduled: create_interval_slot(timers),
  };
}
