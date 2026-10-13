export const GAME_CLOCK_INTERVAL_STATUS = {
  STOPPED: "stopped",
  RUNNING: "running",
} as const;

export type GameClockIntervalState =
  | { status: typeof GAME_CLOCK_INTERVAL_STATUS.STOPPED }
  | {
      status: typeof GAME_CLOCK_INTERVAL_STATUS.RUNNING;
      interval_id: ReturnType<typeof setInterval>;
    };

export function create_stopped_game_clock_interval_state(): GameClockIntervalState {
  return { status: GAME_CLOCK_INTERVAL_STATUS.STOPPED };
}

export function is_game_clock_interval_running(
  interval_state: GameClockIntervalState,
): boolean {
  return interval_state.status === GAME_CLOCK_INTERVAL_STATUS.RUNNING;
}

export function clear_game_clock_interval(
  interval_state: GameClockIntervalState,
): GameClockIntervalState {
  switch (interval_state.status) {
    case GAME_CLOCK_INTERVAL_STATUS.RUNNING:
      clearInterval(interval_state.interval_id);
      return create_stopped_game_clock_interval_state();
    case GAME_CLOCK_INTERVAL_STATUS.STOPPED:
      return interval_state;
  }
}
