import type { ManagedGameLoadResult } from "$lib/presentation/logic/managedGamePageTypes";

import {
  clear_game_clock_interval,
  create_stopped_game_clock_interval_state,
  GAME_CLOCK_INTERVAL_STATUS,
  type GameClockIntervalState,
  is_game_clock_interval_running,
} from "./gameClockIntervalState";
import type { ManagedGamePageState } from "./managedGamePageControllerState";
import { update_managed_game_page_state } from "./managedGamePageControllerStateAccess";

export type ManagedGameClockCommand = {
  get_fixture_id: () => string;
  get_state: () => ManagedGamePageState;
  load_bundle: (fixture_id: string) => Promise<ManagedGameLoadResult>;
  set_state: (state: ManagedGamePageState) => void;
};

type ManagedGameClockIntervalState = GameClockIntervalState;

export type ManagedGameClockContext = {
  command: ManagedGameClockCommand;
  interval_holder: { state: ManagedGameClockIntervalState };
};

const CLOCK_TICK_INTERVAL_MILLISECONDS = 1000;

export function create_managed_game_clock_context(
  command: ManagedGameClockCommand,
): ManagedGameClockContext {
  return {
    command,
    interval_holder: { state: create_stopped_game_clock_interval_state() },
  };
}

export function update_managed_game_clock_state(
  context: ManagedGameClockContext,
  updater: (state: ManagedGamePageState) => ManagedGamePageState,
): ManagedGamePageState {
  return update_managed_game_page_state(context.command, updater);
}

export function stop_managed_game_clock(
  context: ManagedGameClockContext,
): void {
  context.interval_holder.state = clear_game_clock_interval(
    context.interval_holder.state,
  );
  update_managed_game_clock_state(context, (state) => ({
    ...state,
    is_clock_running: false,
  }));
}

export function start_managed_game_clock(
  context: ManagedGameClockContext,
): void {
  if (is_game_clock_interval_running(context.interval_holder.state)) return;
  update_managed_game_clock_state(context, (state) => ({
    ...state,
    is_clock_running: true,
  }));
  const interval_id = setInterval(() => {
    update_managed_game_clock_state(context, (state) => ({
      ...state,
      game_clock_seconds: state.game_clock_seconds + 1,
    }));
  }, CLOCK_TICK_INTERVAL_MILLISECONDS);
  context.interval_holder.state = {
    status: GAME_CLOCK_INTERVAL_STATUS.RUNNING,
    interval_id,
  };
}

export function toggle_managed_game_clock(
  context: ManagedGameClockContext,
): void {
  if (context.command.get_state().is_clock_running) {
    stop_managed_game_clock(context);
    return;
  }
  start_managed_game_clock(context);
}
