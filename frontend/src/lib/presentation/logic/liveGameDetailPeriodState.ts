import type { Competition } from "$lib/core/entities/Competition";
import {
  type Fixture,
  type GamePeriod,
  get_period_display_name,
} from "$lib/core/entities/Fixture";
import type { Sport, SportGamePeriod } from "$lib/core/entities/Sport";

export interface PeriodButtonConfig {
  label: string;
  icon: string;
  is_end_action: boolean;
  next_period: GamePeriod;
  message: string;
  confirm_text: string;
}

export function get_effective_periods_for(
  sport: Sport | null,
  competition: Competition | null,
): SportGamePeriod[] {
  return (competition?.rule_overrides?.periods ??
    sport?.periods ??
    []) as unknown as SportGamePeriod[];
}

export function get_playing_periods(
  periods: SportGamePeriod[],
): SportGamePeriod[] {
  return periods.filter((period) => !period.is_break);
}

export function get_period_start_seconds(
  period: GamePeriod,
  playing_periods: SportGamePeriod[],
): number {
  let start_seconds = 0;
  for (const playing_period of playing_periods) {
    if (playing_period.id === period) return start_seconds;
    start_seconds += playing_period.duration_minutes * 60;
  }
  return start_seconds;
}

export function get_current_period_duration_seconds(
  period: GamePeriod,
  playing_periods: SportGamePeriod[],
): number {
  const found_period = playing_periods.find(
    (playing_period) => playing_period.id === period,
  );
  return found_period
    ? found_period.duration_minutes * 60
    : playing_periods.length > 0
      ? playing_periods[0].duration_minutes * 60
      : 45 * 60;
}

export function get_sport_period_display_name(
  period: GamePeriod,
  periods: SportGamePeriod[],
): string {
  const found_period = periods.find(
    (current_period) => current_period.id === period,
  );
  return found_period ? found_period.name : get_period_display_name(period);
}

export function build_period_button_config(
  current_period: Fixture["current_period"] | null | undefined,
  game_active: boolean,
  all_periods: SportGamePeriod[],
): PeriodButtonConfig | null {
  if (!current_period || !game_active || all_periods.length === 0) return null;
  const current_index = all_periods.findIndex(
    (period) => period.id === current_period,
  );
  if (current_index === -1) return null;
  const current_period_definition = all_periods[current_index];
  if (!current_period_definition.is_break) {
    const next_period =
      current_index + 1 < all_periods.length
        ? all_periods[current_index + 1]
        : null;
    return {
      label: `End ${current_period_definition.name}`,
      icon: "⏹️",
      is_end_action: true,
      next_period: next_period?.id ?? "finished",
      message: `Are you sure you want to end ${current_period_definition.name}?`,
      confirm_text: `End ${current_period_definition.name}`,
    };
  }
  const next_playing_period = all_periods
    .slice(current_index + 1)
    .find((period) => !period.is_break);
  if (!next_playing_period) return null;
  return {
    label: `Start ${next_playing_period.name}`,
    icon: "▶️",
    is_end_action: false,
    next_period: next_playing_period.id as GamePeriod,
    message: `Are you sure you want to start ${next_playing_period.name}? The clock will resume.`,
    confirm_text: `Start ${next_playing_period.name}`,
  };
}

export function check_is_playing_period(
  period: Fixture["current_period"] | null | undefined,
  all_periods: SportGamePeriod[],
): boolean {
  if (!period) return false;
  if (period === "penalty_shootout") return true;
  if (all_periods.length === 0)
    return [
      "first_half",
      "second_half",
      "extra_time_first",
      "extra_time_second",
    ].includes(period);
  const found_period = all_periods.find(
    (current_period) => current_period.id === period,
  );
  return found_period ? !found_period.is_break : false;
}
