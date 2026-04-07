import type { Fixture } from "$lib/core/entities/Fixture";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
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

import type { FixtureUseCases } from "./liveGameDetailPageActionTypes";

export async function confirm_live_game_period_action(command: {
  effective_periods: SportGamePeriod[];
  elapsed_minutes: number;
  fixture: Fixture;
  fixture_use_cases: FixtureUseCases;
  game_clock_seconds: number;
  period_button_config: PeriodButtonConfig;
  playing_periods: SportGamePeriod[];
}): Promise<
  | {
      fixture: Fixture;
      game_clock_seconds: number;
      should_start_clock: boolean;
      success: true;
      toast_message: string;
    }
  | { error_message: string; success: false }
> {
  if (command.period_button_config.is_end_action) {
    const end_result = await end_game_period(
      command.fixture,
      command.elapsed_minutes,
      command.fixture_use_cases,
    );
    if (!end_result.success)
      return {
        success: false,
        error_message: "Failed to end period: failed to record event",
      };
    await command.fixture_use_cases.update_period(
      end_result.data.fixture.id,
      end_result.data.fixture.current_period,
      command.elapsed_minutes,
    );
    return {
      success: true,
      fixture: end_result.data.fixture,
      game_clock_seconds: command.game_clock_seconds,
      should_start_clock: !check_is_playing_period(
        end_result.data.fixture.current_period,
        command.effective_periods,
      ),
      toast_message: `${end_result.data.completed_period_label} ended`,
    };
  }
  const next_game_clock_seconds = get_period_start_seconds(
    command.period_button_config.next_period,
    command.playing_periods,
  );
  const change_result = await change_game_period(
    command.fixture,
    command.period_button_config.next_period,
    Math.floor(next_game_clock_seconds / 60),
    command.fixture_use_cases,
  );
  return change_result.success
    ? {
        success: true,
        fixture: change_result.data,
        game_clock_seconds: next_game_clock_seconds,
        should_start_clock: true,
        toast_message: `${get_sport_period_display_name(command.period_button_config.next_period, command.effective_periods)} started!`,
      }
    : {
        success: false,
        error_message: `Failed to change period: ${change_result.error}`,
      };
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
      command.fixture.current_period ?? "first_half",
      command.effective_periods,
    ),
    command.fixture_use_cases,
  );
  return result.success
    ? {
        success: true,
        fixture: result.data,
        seconds_added: command.extra_minutes_to_add * 60,
        toast_message: `${command.extra_minutes_to_add} min added time - ${get_sport_period_display_name(result.data.current_period ?? "first_half", command.effective_periods)}`,
      }
    : { success: false, error_message: "Failed to record extra time event" };
}
