import type { GamePeriod } from "$lib/core/entities/Fixture";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

export type PeriodMinuteWindow = { start_minute: number; end_minute: number };

type NormalizedEventTime = {
  minute: number;
  stoppage_time_minute: number;
};

const FIRST_MINUTE_OFFSET = 1;

export function build_playing_period_window(
  period_id: GamePeriod,
  playing_periods: SportGamePeriod[],
): Option<PeriodMinuteWindow> {
  const period_index = playing_periods.findIndex(
    (period) => period.id === period_id,
  );
  if (period_index === -1) return create_none_option();
  const start_minute = playing_periods
    .slice(0, period_index)
    .reduce((total, period) => total + period.duration_minutes, 0);
  return create_some_option({
    start_minute,
    end_minute: start_minute + playing_periods[period_index].duration_minutes,
  });
}

export function normalize_event_time_for_period(
  minute: number,
  window: Option<PeriodMinuteWindow>,
): NormalizedEventTime {
  if (window.status === OptionStatus.NONE)
    return { minute, stoppage_time_minute: 0 };
  const { start_minute, end_minute } = window.value;
  if (minute > end_minute)
    return { minute: end_minute, stoppage_time_minute: minute - end_minute };
  return {
    minute:
      start_minute > 0
        ? Math.max(minute, start_minute + FIRST_MINUTE_OFFSET)
        : minute,
    stoppage_time_minute: 0,
  };
}
