import type { GamePeriod } from "$lib/core/entities/Fixture";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

export type EventTimingContext = {
  effective_periods: SportGamePeriod[];
  current_period_id: Option<GamePeriod>;
  elapsed_minutes: number;
};

export type AttributedEventTime = {
  minute: number;
  stoppage_time_minute: number;
  period: Option<GamePeriod>;
};

type PeriodWindow = {
  period_id: GamePeriod;
  start_minute: number;
  end_minute: number;
};

export const EVENT_TIMING_MESSAGE = {
  MINUTE_NOT_PLAYED:
    "That minute hasn't been played yet. Enter a minute up to the current game time.",
  NEGATIVE_MINUTE: "Enter a minute of 0 or more.",
} as const;

const CURRENT_MINUTE_ALLOWANCE = 1;
const FIRST_MINUTE = 0;
const NO_STOPPAGE = 0;
const NOT_FOUND_INDEX = -1;

function find_reference_period_index(
  periods: SportGamePeriod[],
  current_period_id: Option<GamePeriod>,
): number {
  if (current_period_id.status === OptionStatus.NONE) return NOT_FOUND_INDEX;
  const current_index = periods.findIndex(
    (period) => period.id === current_period_id.value,
  );
  for (let index = current_index; index >= 0; index--) {
    if (!periods[index].is_break) return index;
  }
  return NOT_FOUND_INDEX;
}

function build_reached_windows(
  periods: SportGamePeriod[],
  reference_index: number,
): PeriodWindow[] {
  let start_minute = FIRST_MINUTE;
  return periods
    .slice(0, reference_index + 1)
    .filter((period) => !period.is_break)
    .map((period) => {
      const window = {
        period_id: period.id,
        start_minute,
        end_minute: start_minute + period.duration_minutes,
      };
      start_minute = window.end_minute;
      return window;
    });
}

function contains_minute(window: PeriodWindow, minute: number): boolean {
  if (minute === FIRST_MINUTE) return window.start_minute === FIRST_MINUTE;
  return minute > window.start_minute && minute <= window.end_minute;
}

function attribute_to_reference(
  minute: number,
  reference: PeriodWindow,
): AttributedEventTime {
  const is_stoppage_time = minute > reference.end_minute;
  return {
    minute: is_stoppage_time ? reference.end_minute : minute,
    stoppage_time_minute: is_stoppage_time
      ? minute - reference.end_minute
      : NO_STOPPAGE,
    period: create_some_option(reference.period_id),
  };
}

function attribute_within_periods(
  minute: number,
  windows: PeriodWindow[],
): AttributedEventTime {
  const reference = windows[windows.length - 1];
  const earlier_window = windows
    .slice(0, -1)
    .find((window) => contains_minute(window, minute));
  if (!earlier_window) return attribute_to_reference(minute, reference);
  return {
    minute,
    stoppage_time_minute: NO_STOPPAGE,
    period: create_some_option(earlier_window.period_id),
  };
}

export function attribute_event_time(
  minute: number,
  context: EventTimingContext,
): Result<AttributedEventTime, string> {
  if (minute < FIRST_MINUTE)
    return create_failure_result(EVENT_TIMING_MESSAGE.NEGATIVE_MINUTE);
  if (minute > context.elapsed_minutes + CURRENT_MINUTE_ALLOWANCE)
    return create_failure_result(EVENT_TIMING_MESSAGE.MINUTE_NOT_PLAYED);
  const reference_index = find_reference_period_index(
    context.effective_periods,
    context.current_period_id,
  );
  if (reference_index === NOT_FOUND_INDEX)
    return create_success_result({
      minute,
      stoppage_time_minute: NO_STOPPAGE,
      period: create_none_option(),
    });
  return create_success_result(
    attribute_within_periods(
      minute,
      build_reached_windows(context.effective_periods, reference_index),
    ),
  );
}
