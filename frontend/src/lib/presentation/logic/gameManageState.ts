import type { GameEvent, GamePeriod } from "$lib/core/entities/Fixture";
import {
  GAME_PERIOD,
  type GamePeriodValue,
} from "$lib/core/entities/StatusConstants";

import { GAME_EVENT_BACKGROUND_CLASS_BY_TYPE } from "./gameEventDisplayConstants";

const PERIOD_DURATION_MINUTES = 45;
export const PERIOD_DURATION_SECONDS = PERIOD_DURATION_MINUTES * 60;

interface GameClockState {
  elapsed_minutes: number;
  elapsed_seconds_in_minute: number;
  current_period_duration: number;
  period_elapsed_seconds: number;
  remaining_seconds_in_period: number;
  countdown_minutes: number;
  countdown_seconds: number;
  clock_display: string;
}

const EXTRA_TIME_PERIOD_DURATION_SECONDS = 15 * 60;

const PERIOD_START_SECONDS_BY_PERIOD: Readonly<
  Record<GamePeriodValue, number>
> = {
  [GAME_PERIOD.PRE_GAME]: 0,
  [GAME_PERIOD.FIRST_HALF]: 0,
  [GAME_PERIOD.HALF_TIME]: 0,
  [GAME_PERIOD.SECOND_HALF]: PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.EXTRA_TIME_FIRST]: PERIOD_DURATION_SECONDS * 2,
  [GAME_PERIOD.EXTRA_TIME_SECOND]:
    PERIOD_DURATION_SECONDS * 2 + EXTRA_TIME_PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.PENALTY_SHOOTOUT]: 0,
  [GAME_PERIOD.FINISHED]: 0,
};

const PERIOD_DURATION_SECONDS_BY_PERIOD: Readonly<
  Record<GamePeriodValue, number>
> = {
  [GAME_PERIOD.PRE_GAME]: PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.FIRST_HALF]: PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.HALF_TIME]: PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.SECOND_HALF]: PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.EXTRA_TIME_FIRST]: EXTRA_TIME_PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.EXTRA_TIME_SECOND]: EXTRA_TIME_PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.PENALTY_SHOOTOUT]: PERIOD_DURATION_SECONDS,
  [GAME_PERIOD.FINISHED]: PERIOD_DURATION_SECONDS,
};

const NEXT_PERIOD_BY_PERIOD: Readonly<Record<GamePeriodValue, GamePeriod>> = {
  [GAME_PERIOD.PRE_GAME]: GAME_PERIOD.FIRST_HALF,
  [GAME_PERIOD.FIRST_HALF]: GAME_PERIOD.HALF_TIME,
  [GAME_PERIOD.HALF_TIME]: GAME_PERIOD.SECOND_HALF,
  [GAME_PERIOD.SECOND_HALF]: GAME_PERIOD.FINISHED,
  [GAME_PERIOD.EXTRA_TIME_FIRST]: GAME_PERIOD.EXTRA_TIME_SECOND,
  [GAME_PERIOD.EXTRA_TIME_SECOND]: GAME_PERIOD.FINISHED,
  [GAME_PERIOD.PENALTY_SHOOTOUT]: GAME_PERIOD.FINISHED,
  [GAME_PERIOD.FINISHED]: GAME_PERIOD.FINISHED,
};

function is_standard_game_period(
  period: GamePeriod,
): period is GamePeriodValue {
  return Object.values<string>(GAME_PERIOD).includes(period);
}

export function get_period_start_seconds(period: GamePeriod): number {
  return is_standard_game_period(period)
    ? PERIOD_START_SECONDS_BY_PERIOD[period]
    : 0;
}

function get_current_period_duration_seconds(period: GamePeriod): number {
  return is_standard_game_period(period)
    ? PERIOD_DURATION_SECONDS_BY_PERIOD[period]
    : PERIOD_DURATION_SECONDS;
}

export function build_game_clock_state(
  game_clock_seconds: number,
  current_period: GamePeriod,
): GameClockState {
  const elapsed_minutes = Math.floor(game_clock_seconds / 60);
  const elapsed_seconds_in_minute = game_clock_seconds % 60;
  const current_period_duration =
    get_current_period_duration_seconds(current_period);
  const period_elapsed_seconds =
    game_clock_seconds - get_period_start_seconds(current_period);
  const remaining_seconds_in_period = Math.max(
    0,
    current_period_duration - period_elapsed_seconds,
  );
  const countdown_minutes = Math.floor(remaining_seconds_in_period / 60);
  const countdown_seconds = remaining_seconds_in_period % 60;

  return {
    elapsed_minutes,
    elapsed_seconds_in_minute,
    current_period_duration,
    period_elapsed_seconds,
    remaining_seconds_in_period,
    countdown_minutes,
    countdown_seconds,
    clock_display: `${countdown_minutes.toString().padStart(2, "0")}:${countdown_seconds
      .toString()
      .padStart(2, "0")}`,
  };
}

export function sort_game_events(game_events: GameEvent[]): GameEvent[] {
  return [...game_events].sort(
    (left_event, right_event) =>
      right_event.minute - left_event.minute ||
      new Date(right_event.recorded_at).getTime() -
        new Date(left_event.recorded_at).getTime(),
  );
}

export function get_next_period(current_period: GamePeriod): GamePeriod {
  return is_standard_game_period(current_period)
    ? NEXT_PERIOD_BY_PERIOD[current_period]
    : GAME_PERIOD.FINISHED;
}

export function get_event_bg_class(event: GameEvent): string {
  return GAME_EVENT_BACKGROUND_CLASS_BY_TYPE[event.event_type];
}
