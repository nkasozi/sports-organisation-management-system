import {
  confirm_live_game_extra_time_action,
  confirm_live_game_period_action,
  type LiveGameDetailPageActionDependencies,
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

export function create_live_game_detail_period_handlers(command: {
  action_dependencies: LiveGameDetailPageActionDependencies;
  get_modal_state: () => LiveGameDetailModalState;
  get_page_state: () => LiveGameDetailPageState;
  get_view_state: () => LiveGameDetailDerivedState;
  set_modal_state: (state: LiveGameDetailModalState) => void;
  set_page_state: (state: LiveGameDetailPageState) => void;
  set_toast_state: (state: LiveGameDetailToastState) => void;
  start_clock: () => void;
  stop_clock: () => void;
}): {
  confirm_extra_time: () => Promise<void>;
  confirm_period_action: () => Promise<void>;
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
    confirm_period_action: async (): Promise<void> => {
      const page_state = command.get_page_state();
      const view_state = command.get_view_state();
      if (!page_state.fixture || !view_state.period_button_config) return;
      set_modal_state((modal_state) => ({
        ...modal_state,
        show_period_modal: false,
      }));
      if (view_state.period_button_config.is_end_action) command.stop_clock();
      set_page_state((current_page_state) => ({
        ...current_page_state,
        is_updating: true,
      }));
      const result = await confirm_live_game_period_action({
        fixture: page_state.fixture,
        period_button_config: view_state.period_button_config,
        elapsed_minutes: view_state.elapsed_minutes,
        game_clock_seconds: page_state.game_clock_seconds,
        effective_periods: view_state.effective_periods,
        playing_periods: view_state.playing_periods,
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
        game_clock_seconds: result.game_clock_seconds,
        extra_time_added_seconds: 0,
        break_elapsed_seconds: 0,
      }));
      if (result.should_start_clock) command.start_clock();
      show_live_game_detail_toast(
        command.set_toast_state,
        result.toast_message,
        "info",
      );
    },
    confirm_extra_time: async (): Promise<void> => {
      const page_state = command.get_page_state();
      if (!page_state.fixture || page_state.extra_minutes_to_add < 1) return;
      set_modal_state((modal_state) => ({
        ...modal_state,
        show_extra_time_modal: false,
      }));
      set_page_state((current_page_state) => ({
        ...current_page_state,
        is_updating: true,
      }));
      const result = await confirm_live_game_extra_time_action({
        fixture: page_state.fixture,
        elapsed_minutes: command.get_view_state().elapsed_minutes,
        extra_minutes_to_add: page_state.extra_minutes_to_add,
        effective_periods: command.get_view_state().effective_periods,
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
        extra_time_added_seconds:
          current_page_state.extra_time_added_seconds + result.seconds_added,
        extra_minutes_to_add: 5,
      }));
      if (!command.get_page_state().is_clock_running) command.start_clock();
      show_live_game_detail_toast(
        command.set_toast_state,
        result.toast_message,
        "success",
      );
    },
  };
}
