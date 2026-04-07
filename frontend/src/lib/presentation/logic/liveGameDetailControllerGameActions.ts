import {
  end_live_game_detail_action,
  type LiveGameDetailPageActionDependencies,
  start_live_game_detail_action,
} from "$lib/presentation/logic/liveGameDetailPageActions";
import {
  type LiveGameDetailDerivedState,
  type LiveGameDetailModalState,
  type LiveGameDetailPageState,
  type LiveGameDetailToastState,
} from "$lib/presentation/logic/liveGameDetailPageState";

import {
  show_live_game_detail_toast,
  update_live_game_detail_state,
} from "./liveGameDetailControllerUtils";

export function create_live_game_detail_game_handlers(command: {
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
}): {
  end_game: () => Promise<void>;
  start_game: () => Promise<void>;
} {
  const set_page_state = (
    updater: (state: LiveGameDetailPageState) => LiveGameDetailPageState,
  ): LiveGameDetailPageState =>
    update_live_game_detail_state({
      get_state: command.get_page_state,
      set_state: command.set_page_state,
      updater,
    });

  const set_modal_state = (
    updater: (state: LiveGameDetailModalState) => LiveGameDetailModalState,
  ): LiveGameDetailModalState =>
    update_live_game_detail_state({
      get_state: command.get_modal_state,
      set_state: command.set_modal_state,
      updater,
    });

  return {
    start_game: async (): Promise<void> => {
      const page_state = command.get_page_state();
      if (!page_state.fixture) return;
      set_modal_state((modal_state) => ({
        ...modal_state,
        show_start_modal: false,
      }));
      set_page_state((current_page_state) => ({
        ...current_page_state,
        is_updating: true,
      }));
      const result = await start_live_game_detail_action({
        ...command.action_dependencies,
        fixture: page_state.fixture,
        home_players: page_state.home_players,
        away_players: page_state.away_players,
        home_team: page_state.home_team,
        away_team: page_state.away_team,
        allow_auto_submission:
          page_state.competition?.allow_auto_squad_submission ?? false,
        playing_periods: command.get_view_state().playing_periods,
        reload_fixture: command.reload_fixture_bundle,
      });
      set_page_state((current_page_state) => ({
        ...current_page_state,
        is_updating: false,
      }));
      if (!result.success) {
        show_live_game_detail_toast(
          command.set_toast_state,
          result.error_message,
          "error",
        );
        return;
      }
      set_page_state((current_page_state) => ({
        ...current_page_state,
        fixture: result.fixture,
        game_clock_seconds: 0,
      }));
      command.start_clock();
      show_live_game_detail_toast(
        command.set_toast_state,
        result.toast_message,
        "success",
      );
    },
    end_game: async (): Promise<void> => {
      const page_state = command.get_page_state();
      if (!page_state.fixture) return;
      command.stop_clock();
      set_modal_state((modal_state) => ({
        ...modal_state,
        show_end_modal: false,
      }));
      set_page_state((current_page_state) => ({
        ...current_page_state,
        is_updating: true,
      }));
      const result = await end_live_game_detail_action({
        fixture: page_state.fixture,
        elapsed_minutes: command.get_view_state().elapsed_minutes,
        home_score: command.get_view_state().home_score,
        away_score: command.get_view_state().away_score,
        fixture_use_cases: command.action_dependencies.fixture_use_cases,
      });
      set_page_state((current_page_state) => ({
        ...current_page_state,
        is_updating: false,
      }));
      if (!result.success) {
        show_live_game_detail_toast(
          command.set_toast_state,
          result.error_message,
          "error",
        );
        return;
      }
      set_page_state((current_page_state) => ({
        ...current_page_state,
        fixture: result.fixture,
        home_lineup_expanded: true,
        away_lineup_expanded: true,
      }));
      show_live_game_detail_toast(
        command.set_toast_state,
        "Game completed!",
        "success",
      );
    },
  };
}
