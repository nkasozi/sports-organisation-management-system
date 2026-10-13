import {
  end_live_game_detail_action,
  type LiveGameDetailPageActionDependencies,
  start_live_game_detail_action,
} from "$lib/presentation/logic/liveGameDetailPageActions";
import type {
  LiveGameDetailDerivedState,
  LiveGameDetailModalState,
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "$lib/presentation/logic/liveGameDetailPageState";

import {
  set_live_game_detail_updating,
  update_live_game_detail_modal_state,
  update_live_game_detail_page_state,
} from "./liveGameDetailControllerStateAccess";
import { show_live_game_detail_toast } from "./liveGameDetailControllerUtils";
import {
  build_live_game_detail_modal_state,
  LIVE_GAME_DETAIL_MODAL,
} from "./liveGameDetailPageStateMachine";
import { TOAST_KIND } from "./toastConfig";

export type LiveGameDetailGameHandlersCommand = {
  action_dependencies: LiveGameDetailPageActionDependencies;
  get_modal_state: () => LiveGameDetailModalState;
  get_page_state: () => LiveGameDetailPageState;
  get_view_state: () => Pick<
    LiveGameDetailDerivedState,
    "away_score" | "elapsed_minutes" | "home_score" | "playing_periods"
  >;
  reload_fixture_bundle: () => Promise<LiveGameDetailPageState["fixture"]>;
  set_modal_state: (state: LiveGameDetailModalState) => void;
  set_page_state: (state: LiveGameDetailPageState) => void;
  set_toast_state: (state: LiveGameDetailToastState) => void;
  start_clock: () => void;
  stop_clock: () => void;
};

type LiveGameDetailFixture = NonNullable<LiveGameDetailPageState["fixture"]>;

const GAME_COMPLETED_TOAST_MESSAGE = "Game completed!";

function request_game_start(
  command: LiveGameDetailGameHandlersCommand,
  page_state: LiveGameDetailPageState,
  fixture: LiveGameDetailFixture,
): ReturnType<typeof start_live_game_detail_action> {
  return start_live_game_detail_action({
    ...command.action_dependencies,
    fixture,
    home_players: page_state.home_players,
    away_players: page_state.away_players,
    home_team: page_state.home_team,
    away_team: page_state.away_team,
    allow_auto_submission:
      page_state.competition?.allow_auto_squad_submission ?? false,
    playing_periods: command.get_view_state().playing_periods,
    reload_fixture: command.reload_fixture_bundle,
  });
}

export async function start_live_game_detail_game(
  command: LiveGameDetailGameHandlersCommand,
): Promise<void> {
  const page_state = command.get_page_state();
  if (!page_state.fixture) return;
  update_live_game_detail_modal_state(command, () =>
    build_live_game_detail_modal_state(LIVE_GAME_DETAIL_MODAL.NONE),
  );
  set_live_game_detail_updating(command, true);
  const result = await request_game_start(
    command,
    page_state,
    page_state.fixture,
  );
  set_live_game_detail_updating(command, false);
  if (!result.success) {
    show_live_game_detail_toast(
      command.set_toast_state,
      result.error_message,
      TOAST_KIND.ERROR,
    );
    return;
  }
  update_live_game_detail_page_state(command, (current_page_state) => ({
    ...current_page_state,
    fixture: result.fixture,
    game_clock_seconds: 0,
  }));
  command.start_clock();
  show_live_game_detail_toast(
    command.set_toast_state,
    result.toast_message,
    TOAST_KIND.SUCCESS,
  );
}

function request_game_end(
  command: LiveGameDetailGameHandlersCommand,
  fixture: LiveGameDetailFixture,
): ReturnType<typeof end_live_game_detail_action> {
  return end_live_game_detail_action({
    fixture,
    elapsed_minutes: command.get_view_state().elapsed_minutes,
    home_score: command.get_view_state().home_score,
    away_score: command.get_view_state().away_score,
    fixture_use_cases: command.action_dependencies.fixture_use_cases,
  });
}

export async function end_live_game_detail_game(
  command: LiveGameDetailGameHandlersCommand,
): Promise<void> {
  const page_state = command.get_page_state();
  if (!page_state.fixture) return;
  command.stop_clock();
  update_live_game_detail_modal_state(command, () =>
    build_live_game_detail_modal_state(LIVE_GAME_DETAIL_MODAL.NONE),
  );
  set_live_game_detail_updating(command, true);
  const result = await request_game_end(command, page_state.fixture);
  set_live_game_detail_updating(command, false);
  if (!result.success) {
    show_live_game_detail_toast(
      command.set_toast_state,
      result.error_message,
      TOAST_KIND.ERROR,
    );
    return;
  }
  update_live_game_detail_page_state(command, (current_page_state) => ({
    ...current_page_state,
    fixture: result.fixture,
    home_lineup_expanded: true,
    away_lineup_expanded: true,
  }));
  show_live_game_detail_toast(
    command.set_toast_state,
    GAME_COMPLETED_TOAST_MESSAGE,
    TOAST_KIND.SUCCESS,
  );
}
