import type { Fixture } from "$lib/core/entities/Fixture";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
import { GAME_PERIOD } from "$lib/core/entities/StatusConstants";
import {
  change_game_period,
  end_game_period,
} from "$lib/presentation/logic/gameManageActions";
import { record_live_game_extra_time_event } from "$lib/presentation/logic/liveGameDetailActions";
import {
  check_is_playing_period,
  get_period_start_seconds,
  get_sport_period_display_name,
  type PeriodButtonConfig,
} from "$lib/presentation/logic/liveGameDetailState";

import {
  build_game_action_failure,
  GAME_ACTION_EVENT,
  GAME_ACTION_USER_MESSAGE,
} from "./gameActionMessages";
import type { FixtureUseCases } from "./liveGameDetailPageActionTypes";

type ConfirmPeriodCommand = {
  effective_periods: SportGamePeriod[];
  elapsed_minutes: number;
  fixture: Fixture;
  fixture_use_cases: FixtureUseCases;
  game_clock_seconds: number;
  period_button_config: PeriodButtonConfig;
  playing_periods: SportGamePeriod[];
};

type ConfirmPeriodResult =
  | {
      fixture: Fixture;
      game_clock_seconds: number;
      should_start_clock: boolean;
      success: true;
      toast_message: string;
    }
  | { error_message: string; success: false };

const SECONDS_PER_MINUTE = 60;

function should_run_break_clock(
  fixture: Fixture,
  effective_periods: SportGamePeriod[],
): boolean {
  if (fixture.current_period === GAME_PERIOD.FINISHED) return false;
  return !check_is_playing_period(fixture.current_period, effective_periods);
}

async function end_current_live_game_period(
  command: ConfirmPeriodCommand,
): Promise<ConfirmPeriodResult> {
  const end_result = await end_game_period({
    fixture: command.fixture,
    minute: command.elapsed_minutes,
    transition: {
      next_period: command.period_button_config.next_period,
      completed_period_label: get_sport_period_display_name(
        command.fixture.current_period,
        command.effective_periods,
      ),
    },
    fixture_use_cases: command.fixture_use_cases,
  });
  if (!end_result.success)
    return build_game_action_failure({
      event: GAME_ACTION_EVENT.END_PERIOD_FAILED,
      fixture_id: command.fixture.id,
      technical_error: end_result.error,
      user_message: GAME_ACTION_USER_MESSAGE.END_PERIOD_FAILED,
    });
  return {
    success: true,
    fixture: end_result.data.fixture,
    game_clock_seconds: command.game_clock_seconds,
    should_start_clock: should_run_break_clock(
      end_result.data.fixture,
      command.effective_periods,
    ),
    toast_message: `${end_result.data.completed_period_label} ended`,
  };
}

async function start_next_live_game_period(
  command: ConfirmPeriodCommand,
): Promise<ConfirmPeriodResult> {
  const next_period = command.period_button_config.next_period;
  const next_game_clock_seconds = get_period_start_seconds(
    next_period,
    command.playing_periods,
  );
  const change_result = await change_game_period({
    fixture: command.fixture,
    new_period: next_period,
    new_period_label: get_sport_period_display_name(
      next_period,
      command.effective_periods,
    ),
    minute: Math.floor(next_game_clock_seconds / SECONDS_PER_MINUTE),
    fixture_use_cases: command.fixture_use_cases,
  });
  return change_result.success
    ? {
        success: true,
        fixture: change_result.data,
        game_clock_seconds: next_game_clock_seconds,
        should_start_clock: true,
        toast_message: `${get_sport_period_display_name(next_period, command.effective_periods)} started!`,
      }
    : build_game_action_failure({
        event: GAME_ACTION_EVENT.CHANGE_PERIOD_FAILED,
        fixture_id: command.fixture.id,
        technical_error: change_result.error,
        user_message: GAME_ACTION_USER_MESSAGE.CHANGE_PERIOD_FAILED,
      });
}

export async function confirm_live_game_period_action(
  command: ConfirmPeriodCommand,
): Promise<ConfirmPeriodResult> {
  if (command.period_button_config.is_end_action)
    return end_current_live_game_period(command);
  return start_next_live_game_period(command);
}

export async function confirm_live_game_extra_time_action(command: {
  effective_periods: SportGamePeriod[];
  elapsed_minutes: number;
  extra_minutes_to_add: number;
  fixture: Fixture;
  fixture_use_cases: FixtureUseCases;
}): Promise<
  | {
      fixture: Fixture;
      seconds_added: number;
      success: true;
      toast_message: string;
    }
  | { error_message: string; success: false }
> {
  const result = await record_live_game_extra_time_event(
    command.fixture.id,
    command.elapsed_minutes,
    command.extra_minutes_to_add,
    get_sport_period_display_name(
      command.fixture.current_period ?? GAME_PERIOD.FIRST_HALF,
      command.effective_periods,
    ),
    command.fixture_use_cases,
  );
  return result.success
    ? {
        success: true,
        fixture: result.data,
        seconds_added: command.extra_minutes_to_add * 60,
        toast_message: `${command.extra_minutes_to_add} min added time - ${get_sport_period_display_name(result.data.current_period ?? GAME_PERIOD.FIRST_HALF, command.effective_periods)}`,
      }
    : build_game_action_failure({
        event: GAME_ACTION_EVENT.EXTRA_TIME_FAILED,
        fixture_id: command.fixture.id,
        technical_error: result.error,
        user_message: GAME_ACTION_USER_MESSAGE.EXTRA_TIME_FAILED,
      });
}
