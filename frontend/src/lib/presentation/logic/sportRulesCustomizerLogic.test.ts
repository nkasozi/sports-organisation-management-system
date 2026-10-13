import { describe, expect, it } from "vitest";

import {
  format_periods_summary,
  format_substitution_limit,
  get_effective_periods,
  get_max_players_on_field,
  get_max_squad_size,
  get_max_substitutions,
  get_min_players_on_field,
  get_overtime_enabled,
  get_return_after_substitution,
  get_rolling_substitutions,
  get_total_playing_time,
  has_custom_squad_limits,
  has_rule_override,
} from "./sportRulesCustomizerLogic";

const FOOTBALL_PERIODS = [
  { duration_minutes: 45, is_break: false },
  { duration_minutes: 15, is_break: true },
  { duration_minutes: 45, is_break: false },
] as never;

function create_sport(): never {
  return {
    periods: FOOTBALL_PERIODS,
    max_players_on_field: 11,
    min_players_on_field: 7,
    max_squad_size: 23,
    substitution_rules: {
      max_substitutions_per_game: 3,
      rolling_substitutions_allowed: false,
      return_after_substitution_allowed: true,
    },
    overtime_rules: { is_enabled: false },
  } as never;
}

function create_periods(count: number): never {
  return Array.from({ length: count }, () => ({
    duration_minutes: 10,
    is_break: false,
  })) as never;
}

describe("sportRulesCustomizerLogic", () => {
  it("summarizes periods by playing period count", () => {
    expect(format_periods_summary([])).toBe("No periods defined");
    expect(format_periods_summary(create_periods(2))).toBe("2 halves (20 min)");
    expect(format_periods_summary(create_periods(3))).toBe(
      "3 periods (30 min)",
    );
    expect(format_periods_summary(create_periods(4))).toBe(
      "4 quarters (40 min)",
    );
    expect(format_periods_summary(create_periods(5))).toBe(
      "5 periods (50 min)",
    );
    expect(get_total_playing_time(FOOTBALL_PERIODS)).toBe(90);
  });

  it("prefers overrides over sport values", () => {
    const sport = create_sport();
    const overrides = {
      periods: create_periods(1),
      max_players_on_field: 9,
      min_players_on_field: 5,
      max_squad_size: 18,
      substitution_rules: {
        max_substitutions_per_game: 7,
        rolling_substitutions_allowed: true,
        return_after_substitution_allowed: false,
      },
      overtime_rules: { is_enabled: true },
    };
    expect(get_effective_periods(overrides, sport)).toBe(overrides.periods);
    expect(get_max_players_on_field(overrides, sport)).toBe(9);
    expect(get_min_players_on_field(overrides, sport)).toBe(5);
    expect(get_max_squad_size(overrides, sport)).toBe(18);
    expect(get_max_substitutions(overrides, sport)).toBe(7);
    expect(get_rolling_substitutions(overrides, sport)).toBe(true);
    expect(get_return_after_substitution(overrides, sport)).toBe(false);
    expect(get_overtime_enabled(overrides, sport)).toBe(true);
  });

  it("falls back to sport values and defaults", () => {
    const sport = create_sport();
    expect(get_max_players_on_field({}, sport)).toBe(11);
    expect(get_max_squad_size({}, sport)).toBe(23);
    expect(get_max_substitutions({}, sport)).toBe(3);
    expect(get_return_after_substitution({}, sport)).toBe(true);
    expect(get_overtime_enabled({}, sport)).toBe(false);
    const sparse_sport = {
      substitution_rules: {},
      overtime_rules: {},
    } as never;
    expect(get_effective_periods({}, sparse_sport)).toEqual([]);
    expect(get_max_players_on_field({}, sparse_sport)).toBe(11);
    expect(get_min_players_on_field({}, sparse_sport)).toBe(7);
    expect(get_max_squad_size({}, sparse_sport)).toBe(20);
    expect(get_max_substitutions({}, sparse_sport)).toBe(5);
    expect(get_rolling_substitutions({}, sparse_sport)).toBe(false);
    expect(get_overtime_enabled({}, sparse_sport)).toBe(true);
  });

  it("detects explicit overrides", () => {
    expect(has_rule_override({ periods: [] }, "periods")).toBe(true);
    expect(has_rule_override({}, "periods")).toBe(false);
    expect(has_custom_squad_limits({})).toBe(false);
    expect(has_custom_squad_limits({ max_squad_size: 10 })).toBe(true);
  });
});

describe("format_substitution_limit", () => {
  it("shows a negative limit as unlimited", () => {
    expect(format_substitution_limit(-1)).toBe("Unlimited subs");
  });

  it("shows a set number of substitutions", () => {
    expect(format_substitution_limit(5)).toBe("5 subs");
  });
});
