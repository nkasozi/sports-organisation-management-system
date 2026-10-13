import { describe, expect, it } from "vitest";

import type { CompetitionRuleOverrides } from "$lib/core/entities/Competition";

import {
  apply_sport_rules_override_action,
  create_sport_rules_customizing_state,
  set_sport_rules_section_customizing,
  SPORT_RULES_FLAG_ACTION,
  SPORT_RULES_NUMBER_ACTION,
  SPORT_RULES_SECTION,
  SPORT_RULES_STRUCTURE_ACTION,
} from "./sportRulesOverrideActions";

const PERIODS = [
  { id: "first", name: "First Half", duration_minutes: 45, is_break: false },
  { id: "break", name: "Half Time", duration_minutes: 15, is_break: true },
  { id: "second", name: "Second Half", duration_minutes: 45, is_break: false },
] as never;

const FULL_OVERRIDES: CompetitionRuleOverrides = {
  periods: PERIODS,
  game_duration_minutes: 90,
  max_players_on_field: 9,
  min_players_on_field: 6,
  max_squad_size: 18,
  substitution_rules: { max_substitutions_per_game: 3 },
  overtime_rules: { is_enabled: true },
};

describe("apply_sport_rules_override_action", () => {
  it("sets periods together with the total playing time excluding breaks", () => {
    expect(
      apply_sport_rules_override_action(
        {},
        { type: SPORT_RULES_STRUCTURE_ACTION.SET_PERIODS, periods: PERIODS },
      ),
    ).toEqual({ periods: PERIODS, game_duration_minutes: 90 });
  });

  it.each([
    [SPORT_RULES_NUMBER_ACTION.SET_MAX_PLAYERS, { max_players_on_field: 8 }],
    [SPORT_RULES_NUMBER_ACTION.SET_MIN_PLAYERS, { min_players_on_field: 8 }],
    [SPORT_RULES_NUMBER_ACTION.SET_MAX_SQUAD, { max_squad_size: 8 }],
    [
      SPORT_RULES_NUMBER_ACTION.SET_MAX_SUBSTITUTIONS,
      { substitution_rules: { max_substitutions_per_game: 8 } },
    ],
  ])("applies the %s number action", (type, expected) => {
    expect(apply_sport_rules_override_action({}, { type, value: 8 })).toEqual(
      expected,
    );
  });

  it("merges substitution flags into existing substitution rules", () => {
    const with_rolling = apply_sport_rules_override_action(
      { substitution_rules: { max_substitutions_per_game: 3 } },
      { type: SPORT_RULES_FLAG_ACTION.SET_ROLLING_SUBSTITUTIONS, value: true },
    );
    const with_return = apply_sport_rules_override_action(with_rolling, {
      type: SPORT_RULES_FLAG_ACTION.SET_RETURN_AFTER_SUBSTITUTION,
      value: false,
    });

    expect(with_return.substitution_rules).toEqual({
      max_substitutions_per_game: 3,
      rolling_substitutions_allowed: true,
      return_after_substitution_allowed: false,
    });
  });

  it("sets the overtime enabled flag", () => {
    expect(
      apply_sport_rules_override_action(
        { overtime_rules: { overtime_type: "extra_time" } as never },
        { type: SPORT_RULES_FLAG_ACTION.SET_OVERTIME_ENABLED, value: false },
      ).overtime_rules,
    ).toEqual({ overtime_type: "extra_time", is_enabled: false });
  });

  it.each([
    [SPORT_RULES_SECTION.PERIODS, ["periods", "game_duration_minutes"]],
    [
      SPORT_RULES_SECTION.SQUAD_LIMITS,
      ["max_players_on_field", "min_players_on_field", "max_squad_size"],
    ],
    [SPORT_RULES_SECTION.SUBSTITUTIONS, ["substitution_rules"]],
    [SPORT_RULES_SECTION.OVERTIME, ["overtime_rules"]],
  ])("resets only the %s section fields", (section, removed_fields) => {
    const result = apply_sport_rules_override_action(FULL_OVERRIDES, {
      type: SPORT_RULES_STRUCTURE_ACTION.RESET_SECTION,
      section,
    });

    removed_fields.forEach((field_name) =>
      expect(result).not.toHaveProperty(field_name),
    );
    expect(Object.keys(result)).toHaveLength(
      Object.keys(FULL_OVERRIDES).length - removed_fields.length,
    );
  });

  it("does not mutate the given overrides", () => {
    const original = { ...FULL_OVERRIDES };
    apply_sport_rules_override_action(FULL_OVERRIDES, {
      type: SPORT_RULES_STRUCTURE_ACTION.RESET_SECTION,
      section: SPORT_RULES_SECTION.PERIODS,
    });
    expect(FULL_OVERRIDES).toEqual(original);
  });
});

describe("sport rules customizing state", () => {
  it("starts with no section being customized", () => {
    expect(
      Object.values(create_sport_rules_customizing_state()).every(
        (is_customizing) => !is_customizing,
      ),
    ).toBe(true);
  });

  it("toggles a single section", () => {
    const state = set_sport_rules_section_customizing(
      create_sport_rules_customizing_state(),
      SPORT_RULES_SECTION.OVERTIME,
      true,
    );
    expect(state).toEqual({
      periods: false,
      squad_limits: false,
      substitutions: false,
      overtime: true,
    });
  });
});
