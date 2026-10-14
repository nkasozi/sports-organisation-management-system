import {
  confirm_live_game_extra_time_action,
  confirm_live_game_period_action,
  type LiveGameDetailPageActionDependencies,
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

export type LiveGameDetailPeriodHandlersCommand = {
  action_dependencies: LiveGameDetailPageActionDependencies;
  get_modal_state: () => LiveGameDetailModalState;
  get_page_state: () => LiveGameDetailPageState;
  get_view_state: () => LiveGameDetailDerivedState;
  set_modal_state: (state: LiveGameDetailModalState) => void;
  set_page_state: (state: LiveGameDetailPageState) => void;
  set_toast_state: (state: LiveGameDetailToastState) => void;
  start_clock: () => void;
  stop_clock: () => void;
};

type LiveGameDetailFixture = NonNullable<LiveGameDetailPageState["fixture"]>;
type PeriodButtonConfig = NonNullable<
  LiveGameDetailDerivedState["period_button_config"]
>;

const DEFAULT_EXTRA_MINUTES_TO_ADD = 5;

function request_period_action(
  command: LiveGameDetailPeriodHandlersCommand,
  page_state: LiveGameDetailPageState,
  fixture: LiveGameDetailFixture,
  period_button_config: PeriodButtonConfig,
): ReturnType<typeof confirm_live_game_period_action> {
  const view_state = command.get_view_state();
  return confirm_live_game_period_action({
    fixture,
    period_button_config,
    elapsed_minutes: view_state.elapsed_minutes,
    game_clock_seconds: page_state.game_clock_seconds,
    effective_periods: view_state.effective_periods,
    playing_periods: view_state.playing_periods,
    fixture_use_cases: command.action_dependencies.fixture_use_cases,
  });
}

type ConfirmedPeriodResult = Extract<
  Awaited<ReturnType<typeof confirm_live_game_period_action>>,
  { success: true }
>;

function apply_confirmed_period_result(
  command: LiveGameDetailPeriodHandlersCommand,
  result: ConfirmedPeriodResult,
): void {
  update_live_game_detail_page_state(command, (current_page_state) => ({
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
    TOAST_KIND.INFO,
  );
}

export async function confirm_live_game_detail_period(
  command: LiveGameDetailPeriodHandlersCommand,
): Promise<void> {
  const page_state = command.get_page_state();
  const view_state = command.get_view_state();
  if (!page_state.fixture || !view_state.period_button_config) return;
  update_live_game_detail_modal_state(command, () =>
    build_live_game_detail_modal_state(LIVE_GAME_DETAIL_MODAL.NONE),
  );
  if (view_state.period_button_config.is_end_action) command.stop_clock();
  set_live_game_detail_updating(command, true);
  const result = await request_period_action(
    command,
    page_state,
    page_state.fixture,
    view_state.period_button_config,
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
  apply_confirmed_period_result(command, result);
}

function request_extra_time(
  command: LiveGameDetailPeriodHandlersCommand,
  page_state: LiveGameDetailPageState,
  fixture: LiveGameDetailFixture,
): ReturnType<typeof confirm_live_game_extra_time_action> {
  return confirm_live_game_extra_time_action({
    fixture,
    elapsed_minutes: command.get_view_state().elapsed_minutes,
    extra_minutes_to_add: page_state.extra_minutes_to_add,
    effective_periods: command.get_view_state().effective_periods,
    fixture_use_cases: command.action_dependencies.fixture_use_cases,
  });
}

export async function confirm_live_game_detail_extra_time(
  command: LiveGameDetailPeriodHandlersCommand,
): Promise<void> {
  const page_state = command.get_page_state();
  if (!page_state.fixture || page_state.extra_minutes_to_add < 1) return;
  update_live_game_detail_modal_state(command, () =>
    build_live_game_detail_modal_state(LIVE_GAME_DETAIL_MODAL.NONE),
  );
  set_live_game_detail_updating(command, true);
  const result = await request_extra_time(
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
    extra_time_added_seconds:
      current_page_state.extra_time_added_seconds + result.seconds_added,
    extra_minutes_to_add: DEFAULT_EXTRA_MINUTES_TO_ADD,
  }));
  command.start_clock();
  show_live_game_detail_toast(
    command.set_toast_state,
    result.toast_message,
    TOAST_KIND.SUCCESS,
  );
}
