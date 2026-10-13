import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import type { LiveGameDetailDataDependencies } from "$lib/presentation/logic/liveGameDetailData";
import { derive_live_game_detail_view_state } from "$lib/presentation/logic/liveGameDetailPageDerivedState";
import type {
  LiveGameDetailEventState,
  LiveGameDetailPageState,
} from "$lib/presentation/logic/liveGameDetailPageState";

import {
  clear_game_clock_interval,
  create_stopped_game_clock_interval_state,
  GAME_CLOCK_INTERVAL_STATUS,
  type GameClockIntervalState,
  is_game_clock_interval_running,
} from "./gameClockIntervalState";
import { update_live_game_detail_state } from "./liveGameDetailControllerUtils";

export type LiveGameDetailClockCommand = {
  data_dependencies: LiveGameDetailDataDependencies;
  fixture_id: () => string;
  get_event_state: () => LiveGameDetailEventState;
  get_page_state: () => LiveGameDetailPageState;
  goto: (path: string) => Promise<unknown>;
  raw_token: () => string;
  set_page_state: (state: LiveGameDetailPageState) => void;
};

export type LiveGameDetailClockIntervalState = GameClockIntervalState;

export type LiveGameDetailClockContext = {
  command: LiveGameDetailClockCommand;
  interval_holder: { state: LiveGameDetailClockIntervalState };
};

const CLOCK_TICK_INTERVAL_MILLISECONDS = 1000;

export function create_live_game_detail_clock_context(
  command: LiveGameDetailClockCommand,
): LiveGameDetailClockContext {
  return {
    command,
    interval_holder: { state: create_stopped_game_clock_interval_state() },
  };
}

export function update_live_game_detail_clock_page_state(
  context: LiveGameDetailClockContext,
  updater: (state: LiveGameDetailPageState) => LiveGameDetailPageState,
): LiveGameDetailPageState {
  return update_live_game_detail_state({
    get_state: context.command.get_page_state,
    set_state: context.command.set_page_state,
    updater,
  });
}

export function stop_live_game_detail_clock(
  context: LiveGameDetailClockContext,
): void {
  context.interval_holder.state = clear_game_clock_interval(
    context.interval_holder.state,
  );
  update_live_game_detail_clock_page_state(context, (page_state) => ({
    ...page_state,
    is_clock_running: false,
  }));
}

function is_clock_start_blocked(context: LiveGameDetailClockContext): boolean {
  const page_state = context.command.get_page_state();
  return (
    is_game_clock_interval_running(context.interval_holder.state) ||
    (page_state.fixture?.status === FIXTURE_STATUS.COMPLETED &&
      page_state.extra_time_added_seconds <= 0)
  );
}

function tick_live_game_detail_clock(
  context: LiveGameDetailClockContext,
): void {
  const page_state = context.command.get_page_state();
  const view_state = derive_live_game_detail_view_state({
    page_state,
    event_state: context.command.get_event_state(),
  });
  update_live_game_detail_clock_page_state(context, (current_page_state) =>
    page_state.fixture?.current_period && !view_state.is_current_period_playing
      ? {
          ...current_page_state,
          break_elapsed_seconds: current_page_state.break_elapsed_seconds + 1,
        }
      : {
          ...current_page_state,
          game_clock_seconds: current_page_state.game_clock_seconds + 1,
        },
  );
}

export function start_live_game_detail_clock(
  context: LiveGameDetailClockContext,
): void {
  if (is_clock_start_blocked(context)) return;
  update_live_game_detail_clock_page_state(context, (page_state) => ({
    ...page_state,
    is_clock_running: true,
  }));
  const interval_id = setInterval(
    () => tick_live_game_detail_clock(context),
    CLOCK_TICK_INTERVAL_MILLISECONDS,
  );
  context.interval_holder.state = {
    status: GAME_CLOCK_INTERVAL_STATUS.RUNNING,
    interval_id,
  };
}

export function toggle_live_game_detail_clock(
  context: LiveGameDetailClockContext,
): void {
  if (context.command.get_page_state().is_clock_running) {
    stop_live_game_detail_clock(context);
    return;
  }
  start_live_game_detail_clock(context);
}
