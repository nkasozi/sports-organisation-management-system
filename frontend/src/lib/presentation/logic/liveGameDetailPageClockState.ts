import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import {
  build_period_button_config,
  check_is_playing_period,
  get_current_period_duration_seconds,
  get_effective_periods_for,
  get_period_start_seconds,
  get_playing_periods,
  get_sport_period_display_name,
} from "$lib/presentation/logic/liveGameDetailState";

import type {
  LiveGameDetailDerivedState,
  LiveGameDetailPageState,
} from "./liveGameDetailPageState";

type LiveGameDetailClockState = Pick<
  LiveGameDetailDerivedState,
  | "effective_periods"
  | "playing_periods"
  | "current_period_id"
  | "current_period_label"
  | "is_current_period_playing"
  | "elapsed_minutes"
  | "remaining_seconds_in_period"
  | "clock_display"
  | "period_button_config"
  | "show_extra_time_button"
>;

type PeriodContext = {
  effective_periods: LiveGameDetailDerivedState["effective_periods"];
  playing_periods: LiveGameDetailDerivedState["playing_periods"];
  current_period_id: LiveGameDetailDerivedState["current_period_id"];
  is_current_period_playing: boolean;
};

const SECONDS_PER_MINUTE = 60;
const DEFAULT_BREAK_DURATION_MINUTES = 5;
const EXTRA_TIME_BUTTON_THRESHOLD_SECONDS = 300;
const FULL_TIME_LABEL = "Full Time";

function compute_current_period_duration(context: PeriodContext): number {
  if (!context.current_period_id) return 0;
  if (context.is_current_period_playing)
    return get_current_period_duration_seconds(
      context.current_period_id,
      context.playing_periods,
    );
  return (
    (context.effective_periods.find(
      (period) => period.id === context.current_period_id,
    )?.duration_minutes || DEFAULT_BREAK_DURATION_MINUTES) * SECONDS_PER_MINUTE
  );
}

function compute_period_elapsed_seconds(
  context: PeriodContext,
  page_state: LiveGameDetailPageState,
): number {
  if (!context.current_period_id) return 0;
  if (context.is_current_period_playing)
    return (
      page_state.game_clock_seconds -
      get_period_start_seconds(
        context.current_period_id,
        context.playing_periods,
      )
    );
  return page_state.break_elapsed_seconds;
}

function build_current_period_label(
  context: PeriodContext,
  page_state: LiveGameDetailPageState,
): string {
  if (context.current_period_id)
    return get_sport_period_display_name(
      context.current_period_id,
      context.effective_periods,
    );
  return page_state.fixture?.status === FIXTURE_STATUS.COMPLETED
    ? FULL_TIME_LABEL
    : page_state.fixture?.scheduled_time || "";
}

function format_clock_display(remaining_seconds: number): string {
  const minutes = String(
    Math.floor(remaining_seconds / SECONDS_PER_MINUTE),
  ).padStart(2, "0");
  const seconds = String(remaining_seconds % SECONDS_PER_MINUTE).padStart(
    2,
    "0",
  );
  return `${minutes}:${seconds}`;
}

function build_period_context(
  page_state: LiveGameDetailPageState,
): PeriodContext {
  const effective_periods = get_effective_periods_for(
    page_state.sport,
    page_state.competition,
  );
  const current_period_id = page_state.fixture?.current_period ?? void 0;
  return {
    effective_periods,
    playing_periods: get_playing_periods(effective_periods),
    current_period_id,
    is_current_period_playing: check_is_playing_period(
      current_period_id,
      effective_periods,
    ),
  };
}

export function derive_live_game_detail_clock_state(
  page_state: LiveGameDetailPageState,
): LiveGameDetailClockState {
  const context = build_period_context(page_state);
  const is_in_progress =
    page_state.fixture?.status === FIXTURE_STATUS.IN_PROGRESS;
  const remaining_seconds_in_period = Math.max(
    0,
    compute_current_period_duration(context) +
      page_state.extra_time_added_seconds -
      compute_period_elapsed_seconds(context, page_state),
  );
  return {
    ...context,
    current_period_label: build_current_period_label(context, page_state),
    elapsed_minutes: Math.floor(
      page_state.game_clock_seconds / SECONDS_PER_MINUTE,
    ),
    remaining_seconds_in_period,
    clock_display: format_clock_display(remaining_seconds_in_period),
    period_button_config: build_period_button_config(
      page_state.fixture?.current_period,
      is_in_progress,
      context.effective_periods,
    ),
    show_extra_time_button:
      is_in_progress &&
      remaining_seconds_in_period <= EXTRA_TIME_BUTTON_THRESHOLD_SECONDS,
  };
}
