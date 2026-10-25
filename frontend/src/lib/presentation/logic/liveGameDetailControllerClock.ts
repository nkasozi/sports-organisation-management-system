import type { LiveGameDetailPageState } from "$lib/presentation/logic/liveGameDetailPageState";

import {
  initialize_live_game_detail_clock,
  load_live_game_detail_fixture_or_error,
  reload_live_game_detail_fixture_bundle,
} from "./liveGameDetailControllerClockLoading";
import { save_live_game_detail_clock_state } from "./liveGameDetailControllerClockSaving";
import {
  create_live_game_detail_clock_context,
  type LiveGameDetailClockCommand,
  type LiveGameDetailClockContext,
  start_live_game_detail_clock,
  stop_live_game_detail_clock,
  toggle_live_game_detail_clock,
} from "./liveGameDetailControllerClockTicking";
import {
  NOT_WATCHING,
  type SpectatorRefreshHandle,
  start_watching_live_game,
} from "./liveGameDetailSpectatorRefresh";

function run_and_save_clock(
  context: LiveGameDetailClockContext,
  clock_action: (context: LiveGameDetailClockContext) => void,
): void {
  clock_action(context);
  void save_live_game_detail_clock_state(context);
}

export function create_live_game_detail_clock_handlers(
  command: LiveGameDetailClockCommand,
  now: () => Date = () => new Date(),
): {
  cleanup: () => void;
  initialize: () => Promise<void>;
  load_fixture_or_error: () => Promise<void>;
  reload_fixture_bundle: () => Promise<LiveGameDetailPageState["fixture"]>;
  start_clock: () => void;
  stop_clock: () => void;
  toggle_clock: () => void;
} {
  const context = create_live_game_detail_clock_context(command, now);
  let watch_handle: SpectatorRefreshHandle = NOT_WATCHING;
  return {
    initialize: async () => {
      await initialize_live_game_detail_clock(context);
      watch_handle.stop();
      watch_handle = start_watching_live_game(context);
    },
    cleanup: (): void => {
      watch_handle.stop();
      stop_live_game_detail_clock(context);
    },
    load_fixture_or_error: () =>
      load_live_game_detail_fixture_or_error(context),
    reload_fixture_bundle: () =>
      reload_live_game_detail_fixture_bundle(context),
    start_clock: (): void =>
      run_and_save_clock(context, start_live_game_detail_clock),
    stop_clock: (): void =>
      run_and_save_clock(context, stop_live_game_detail_clock),
    toggle_clock: (): void =>
      run_and_save_clock(context, toggle_live_game_detail_clock),
  };
}
