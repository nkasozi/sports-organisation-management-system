import type { SportGamePeriod } from "$lib/core/entities/Sport";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

type EditableSportGamePeriod = ScalarInput<SportGamePeriod>;

export const PERIOD_PRESET = {
  HALVES: "halves",
  QUARTERS: "quarters",
  THIRDS: "thirds",
} as const;

export type PeriodPreset = (typeof PERIOD_PRESET)[keyof typeof PERIOD_PRESET];

export function build_game_period_preset(
  preset: PeriodPreset,
): EditableSportGamePeriod[] {
  switch (preset) {
    case PERIOD_PRESET.HALVES:
      return [
        create_preset_period("first_half", "First Half", 45, false, 1),
        create_preset_period("half_time", "Half Time", 15, true, 2),
        create_preset_period("second_half", "Second Half", 45, false, 3),
      ];
    case PERIOD_PRESET.QUARTERS:
      return [
        create_preset_period("first_quarter", "1st Quarter", 12, false, 1),
        create_preset_period("break_1", "Break", 2, true, 2),
        create_preset_period("second_quarter", "2nd Quarter", 12, false, 3),
        create_preset_period("half_time", "Half Time", 15, true, 4),
        create_preset_period("third_quarter", "3rd Quarter", 12, false, 5),
        create_preset_period("break_2", "Break", 2, true, 6),
        create_preset_period("fourth_quarter", "4th Quarter", 12, false, 7),
      ];
    case PERIOD_PRESET.THIRDS:
      return [
        create_preset_period("first_period", "1st Period", 20, false, 1),
        create_preset_period("break_1", "Intermission", 15, true, 2),
        create_preset_period("second_period", "2nd Period", 20, false, 3),
        create_preset_period("break_2", "Intermission", 15, true, 4),
        create_preset_period("third_period", "3rd Period", 20, false, 5),
      ];
  }
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
