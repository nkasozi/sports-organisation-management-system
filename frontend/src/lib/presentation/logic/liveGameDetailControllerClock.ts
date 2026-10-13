import type { LiveGameDetailPageState } from "$lib/presentation/logic/liveGameDetailPageState";

import {
  initialize_live_game_detail_clock,
  load_live_game_detail_fixture_or_error,
  reload_live_game_detail_fixture_bundle,
} from "./liveGameDetailControllerClockLoading";
import {
  create_live_game_detail_clock_context,
  type LiveGameDetailClockCommand,
  start_live_game_detail_clock,
  stop_live_game_detail_clock,
  toggle_live_game_detail_clock,
} from "./liveGameDetailControllerClockTicking";

export function create_live_game_detail_clock_handlers(
  command: LiveGameDetailClockCommand,
): {
  cleanup: () => void;
  initialize: () => Promise<void>;
  load_fixture_or_error: () => Promise<void>;
  reload_fixture_bundle: () => Promise<LiveGameDetailPageState["fixture"]>;
  start_clock: () => void;
  stop_clock: () => void;
  toggle_clock: () => void;
} {
  const context = create_live_game_detail_clock_context(command);
  return {
    initialize: () => initialize_live_game_detail_clock(context),
    cleanup: (): void => stop_live_game_detail_clock(context),
    load_fixture_or_error: () =>
      load_live_game_detail_fixture_or_error(context),
    reload_fixture_bundle: () =>
      reload_live_game_detail_fixture_bundle(context),
    start_clock: (): void => start_live_game_detail_clock(context),
    stop_clock: (): void => stop_live_game_detail_clock(context),
    toggle_clock: (): void => toggle_live_game_detail_clock(context),
  };
}
