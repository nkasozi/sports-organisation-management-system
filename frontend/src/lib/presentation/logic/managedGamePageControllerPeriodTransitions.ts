import {
  type GamePeriod,
  get_period_display_name,
} from "$lib/core/entities/Fixture";
import { GAME_PERIOD } from "$lib/core/entities/StatusConstants";
import {
  change_managed_game_period,
  end_managed_game_period,
} from "$lib/presentation/logic/managedGamePageActions";

import {
  GAME_ACTION_EVENT,
  GAME_ACTION_USER_MESSAGE,
} from "./gameActionMessages";
import {
  apply_managed_game_action_success,
  type ManagedGameGameHandlersCommand,
  show_managed_game_action_failure,
} from "./managedGamePageControllerGameOutcomes";
import { derive_managed_game_view_state } from "./managedGamePageControllerState";
import { update_managed_game_page_state } from "./managedGamePageControllerStateAccess";
import { TOAST_KIND } from "./toastConfig";

const SECOND_HALF_START_MINUTE = 45;
const EXTRA_TIME_FIRST_START_MINUTE = 90;
const SECONDS_PER_MINUTE = 60;

function get_current_elapsed_minutes(
  command: ManagedGameGameHandlersCommand,
): number {
  return derive_managed_game_view_state(command.get_state()).clock_state
    .elapsed_minutes;
}

function resolve_period_start_minute(
  new_period: GamePeriod,
  elapsed_minutes: number,
): number {
  switch (new_period) {
    case GAME_PERIOD.SECOND_HALF:
      return SECOND_HALF_START_MINUTE;
    case GAME_PERIOD.EXTRA_TIME_FIRST:
      return EXTRA_TIME_FIRST_START_MINUTE;
    case GAME_PERIOD.PRE_GAME:
    case GAME_PERIOD.FIRST_HALF:
    case GAME_PERIOD.HALF_TIME:
    case GAME_PERIOD.EXTRA_TIME_SECOND:
    case GAME_PERIOD.PENALTY_SHOOTOUT:
    case GAME_PERIOD.FINISHED:
      return elapsed_minutes;
    default:
      return elapsed_minutes;
  }
}

export async function change_managed_game_page_period(
  command: ManagedGameGameHandlersCommand,
  new_period: GamePeriod,
): Promise<void> {
  const next_minute = resolve_period_start_minute(
    new_period,
    get_current_elapsed_minutes(command),
  );
  update_managed_game_page_state(command, (state) => ({
    ...state,
    is_updating: true,
    game_clock_seconds: next_minute * SECONDS_PER_MINUTE,
  }));
  const result = await change_managed_game_period({
    fixture: command.get_state().fixture,
    new_period,
    minute: next_minute,
    fixture_use_cases: command.fixture_use_cases,
  });
  if (!result.success) {
    show_managed_game_action_failure(command, {
      event: GAME_ACTION_EVENT.CHANGE_PERIOD_FAILED,
      technical_error: result.error,
      user_message: GAME_ACTION_USER_MESSAGE.CHANGE_PERIOD_FAILED,
    });
    return;
  }
  apply_managed_game_action_success(
    command,
    result.data,
    {
      message: `${get_period_display_name(new_period)} started!`,
      type: TOAST_KIND.INFO,
    },
    {},
  );
  command.start_clock();
}

export async function end_managed_game_page_current_period(
  command: ManagedGameGameHandlersCommand,
): Promise<void> {
  command.stop_clock();
  const elapsed_minutes = get_current_elapsed_minutes(command);
  update_managed_game_page_state(command, (state) => ({
    ...state,
    is_updating: true,
  }));
  const result = await end_managed_game_period({
    fixture: command.get_state().fixture,
    minute: elapsed_minutes,
    fixture_use_cases: command.fixture_use_cases,
  });
  if (!result.success) {
    show_managed_game_action_failure(command, {
      event: GAME_ACTION_EVENT.END_PERIOD_FAILED,
      technical_error: result.error,
      user_message: GAME_ACTION_USER_MESSAGE.END_PERIOD_FAILED,
    });
    return;
  }
  apply_managed_game_action_success(
    command,
    result.data.fixture,
    {
      message: `${result.data.completed_period_label} ended`,
      type: TOAST_KIND.INFO,
    },
    {},
  );
}
