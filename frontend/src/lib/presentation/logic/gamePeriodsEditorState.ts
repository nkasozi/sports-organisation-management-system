import type { SportGamePeriod } from "$lib/core/entities/Sport";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

type EditableSportGamePeriod = ScalarInput<SportGamePeriod>;

export type PeriodPreset = "halves" | "quarters" | "thirds";

export function build_game_period_editor_summary(
  periods: EditableSportGamePeriod[],
): {
  sorted_periods: EditableSportGamePeriod[];
  total_break_time: number;
  total_playing_time: number;
  total_time: number;
} {
  const sorted_periods = sort_game_periods(periods);
  const total_playing_time = sorted_periods
    .filter((period) => !period.is_break)
    .reduce(
      (current_total, period) => current_total + period.duration_minutes,
      0,
    );
  const total_break_time = sorted_periods
    .filter((period) => period.is_break)
    .reduce(
      (current_total, period) => current_total + period.duration_minutes,
      0,
    );
  return {
    sorted_periods,
    total_break_time,
    total_playing_time,
    total_time: total_playing_time + total_break_time,
  };
}

export function append_game_period(
  periods: EditableSportGamePeriod[],
): EditableSportGamePeriod[] {
  const next_order = get_next_period_order(periods);
  return [
    ...periods,
    {
      id: build_custom_period_id(periods, "period"),
      name: `Period ${next_order}`,
      duration_minutes: 15,
      is_break: false,
      order: next_order,
    },
  ];
}

export function append_game_break(
  periods: EditableSportGamePeriod[],
): EditableSportGamePeriod[] {
  const next_order = get_next_period_order(periods);
  return [
    ...periods,
    {
      id: build_custom_period_id(periods, "break"),
      name: "Break",
      duration_minutes: 10,
      is_break: true,
      order: next_order,
    },
  ];
}

export function remove_game_period(
  periods: EditableSportGamePeriod[],
  period_id: string,
): EditableSportGamePeriod[] {
  return reorder_game_periods(
    periods.filter((period) => period.id !== period_id),
  );
}

export function move_game_period_up(
  periods: EditableSportGamePeriod[],
  period_id: string,
): EditableSportGamePeriod[] {
  const current_index = periods.findIndex((period) => period.id === period_id);
  if (current_index <= 0) return periods;
  return swap_game_period_orders(periods, current_index, current_index - 1);
}

export function move_game_period_down(
  periods: EditableSportGamePeriod[],
  period_id: string,
): EditableSportGamePeriod[] {
  const current_index = periods.findIndex((period) => period.id === period_id);
  if (current_index < 0 || current_index >= periods.length - 1) return periods;
  return swap_game_period_orders(periods, current_index, current_index + 1);
}

export function rename_game_period(
  periods: EditableSportGamePeriod[],
  period_id: string,
  name: string,
): EditableSportGamePeriod[] {
  return periods.map((period) =>
    period.id === period_id ? { ...period, name } : period,
  );
}

export function set_game_period_duration(
  periods: EditableSportGamePeriod[],
  period_id: string,
  duration_minutes: number,
): EditableSportGamePeriod[] {
  return periods.map((period) =>
    period.id === period_id ? { ...period, duration_minutes } : period,
  );
}

export function build_game_period_preset(
  preset: PeriodPreset,
): EditableSportGamePeriod[] {
  switch (preset) {
    case "halves":
      return [
        create_preset_period("first_half", "First Half", 45, false, 1),
        create_preset_period("half_time", "Half Time", 15, true, 2),
        create_preset_period("second_half", "Second Half", 45, false, 3),
      ];
    case "quarters":
      return [
        create_preset_period("first_quarter", "1st Quarter", 12, false, 1),
        create_preset_period("break_1", "Break", 2, true, 2),
        create_preset_period("second_quarter", "2nd Quarter", 12, false, 3),
        create_preset_period("half_time", "Half Time", 15, true, 4),
        create_preset_period("third_quarter", "3rd Quarter", 12, false, 5),
        create_preset_period("break_2", "Break", 2, true, 6),
        create_preset_period("fourth_quarter", "4th Quarter", 12, false, 7),
      ];
    case "thirds":
      return [
        create_preset_period("first_period", "1st Period", 20, false, 1),
        create_preset_period("break_1", "Intermission", 15, true, 2),
        create_preset_period("second_period", "2nd Period", 20, false, 3),
        create_preset_period("break_2", "Intermission", 15, true, 4),
        create_preset_period("third_period", "3rd Period", 20, false, 5),
      ];
  }
}

function sort_game_periods(
  periods: EditableSportGamePeriod[],
): EditableSportGamePeriod[] {
  return [...periods].sort(
    (left_period, right_period) => left_period.order - right_period.order,
  );
}

function reorder_game_periods(
  periods: EditableSportGamePeriod[],
): EditableSportGamePeriod[] {
  return sort_game_periods(periods).map((period, index) => ({
    ...period,
    order: index + 1,
  }));
}

function swap_game_period_orders(
  periods: EditableSportGamePeriod[],
  first_index: number,
  second_index: number,
): EditableSportGamePeriod[] {
  const reordered_periods = periods.map((period) => ({ ...period }));
  const first_order = reordered_periods[first_index].order;
  reordered_periods[first_index].order = reordered_periods[second_index].order;
  reordered_periods[second_index].order = first_order;
  return reorder_game_periods(reordered_periods);
}

function get_next_period_order(periods: EditableSportGamePeriod[]): number {
  return periods.length > 0
    ? Math.max(...periods.map((period) => period.order)) + 1
    : 1;
}

function build_custom_period_id(
  periods: EditableSportGamePeriod[],
  prefix: "break" | "period",
): string {
  const next_sequence = periods.reduce((current_maximum, period) => {
    if (!period.id.startsWith(`${prefix}_`)) return current_maximum;
    const suffix = Number(period.id.slice(prefix.length + 1));
    return Number.isFinite(suffix)
      ? Math.max(current_maximum, suffix)
      : current_maximum;
  }, 0);
  return `${prefix}_${next_sequence + 1}`;
}

function create_preset_period(
  id: string,
  name: string,
  duration_minutes: number,
  is_break: boolean,
  order: number,
): EditableSportGamePeriod {
  return { id, name, duration_minutes, is_break, order };
}
