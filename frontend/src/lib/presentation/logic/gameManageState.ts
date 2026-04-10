import type { GameEvent, GamePeriod } from "$lib/core/entities/Fixture";

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

export function get_period_start_seconds(period: GamePeriod): number {
  switch (period) {
    case "first_half":
      return 0;
    case "second_half":
      return PERIOD_DURATION_SECONDS;
    case "extra_time_first":
      return PERIOD_DURATION_SECONDS * 2;
    case "extra_time_second":
      return PERIOD_DURATION_SECONDS * 2 + 15 * 60;
    default:
      return 0;
  }
}

function get_current_period_duration_seconds(period: GamePeriod): number {
  switch (period) {
    case "first_half":
    case "second_half":
      return PERIOD_DURATION_SECONDS;
    case "extra_time_first":
    case "extra_time_second":
      return 15 * 60;
    default:
      return PERIOD_DURATION_SECONDS;
  }
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
  const next_period_map: Record<string, GamePeriod> = {
    pre_game: "first_half",
    first_half: "half_time",
    half_time: "second_half",
    second_half: "finished",
    extra_time_first: "extra_time_second",
    extra_time_second: "finished",
    penalty_shootout: "finished",
    finished: "finished",
  };

  return next_period_map[current_period] ?? "finished";
}

export function get_event_bg_class(event: GameEvent): string {
  switch (event.event_type) {
    case "goal":
    case "penalty_scored":
      return "border-l-green-500 bg-green-50 dark:bg-green-900/20";
    case "own_goal":
      return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
    case "yellow_card":
      return "border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
    case "red_card":
    case "second_yellow":
      return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
    case "substitution":
      return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
    case "period_start":
    case "period_end":
      return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20";
    default:
      return "border-l-gray-300 bg-gray-50 dark:bg-accent-800";
  }
}
