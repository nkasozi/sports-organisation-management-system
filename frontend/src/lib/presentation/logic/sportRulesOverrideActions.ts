import type { CompetitionRuleOverrides } from "$lib/core/entities/Competition";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

import { get_total_playing_time } from "./sportRulesCustomizerLogic";

export const SPORT_RULES_SECTION = {
  PERIODS: "periods",
  SQUAD_LIMITS: "squad_limits",
  SUBSTITUTIONS: "substitutions",
  OVERTIME: "overtime",
} as const;

export type SportRulesSection =
  (typeof SPORT_RULES_SECTION)[keyof typeof SPORT_RULES_SECTION];

export const SPORT_RULES_NUMBER_ACTION = {
  SET_MAX_PLAYERS: "set_max_players",
  SET_MIN_PLAYERS: "set_min_players",
  SET_MAX_SQUAD: "set_max_squad",
  SET_MAX_SUBSTITUTIONS: "set_max_substitutions",
} as const;

export const SPORT_RULES_FLAG_ACTION = {
  SET_ROLLING_SUBSTITUTIONS: "set_rolling_substitutions",
  SET_RETURN_AFTER_SUBSTITUTION: "set_return_after_substitution",
  SET_OVERTIME_ENABLED: "set_overtime_enabled",
} as const;

export const SPORT_RULES_STRUCTURE_ACTION = {
  SET_PERIODS: "set_periods",
  RESET_SECTION: "reset_section",
} as const;

export type SportRulesNumberAction =
  (typeof SPORT_RULES_NUMBER_ACTION)[keyof typeof SPORT_RULES_NUMBER_ACTION];

export type SportRulesFlagAction =
  (typeof SPORT_RULES_FLAG_ACTION)[keyof typeof SPORT_RULES_FLAG_ACTION];

export type SportRulesOverrideAction =
  | { type: SportRulesNumberAction; value: number }
  | { type: SportRulesFlagAction; value: boolean }
  | {
      type: typeof SPORT_RULES_STRUCTURE_ACTION.SET_PERIODS;
      periods: ScalarInput<SportGamePeriod>[];
    }
  | {
      type: typeof SPORT_RULES_STRUCTURE_ACTION.RESET_SECTION;
      section: SportRulesSection;
    };

type SportRulesCustomizingState = Record<SportRulesSection, boolean>;

type SubstitutionRuleOverrides = NonNullable<
  CompetitionRuleOverrides["substitution_rules"]
>;

const SECTION_OVERRIDE_FIELDS: Record<
  SportRulesSection,
  ReadonlyArray<keyof CompetitionRuleOverrides>
> = {
  periods: ["periods", "game_duration_minutes"],
  squad_limits: [
    "max_players_on_field",
    "min_players_on_field",
    "max_squad_size",
  ],
  substitutions: ["substitution_rules"],
  overtime: ["overtime_rules"],
};

function reset_section(
  overrides: CompetitionRuleOverrides,
  section: SportRulesSection,
): CompetitionRuleOverrides {
  const next_overrides = { ...overrides };
  SECTION_OVERRIDE_FIELDS[section].forEach(
    (field_name) => delete next_overrides[field_name],
  );
  return next_overrides;
}

function merge_substitution_rules(
  overrides: CompetitionRuleOverrides,
  rule_update: SubstitutionRuleOverrides,
): CompetitionRuleOverrides {
  return {
    ...overrides,
    substitution_rules: { ...overrides.substitution_rules, ...rule_update },
  };
}

function apply_flag_action(
  overrides: CompetitionRuleOverrides,
  type: SportRulesFlagAction,
  value: boolean,
): CompetitionRuleOverrides {
  switch (type) {
    case SPORT_RULES_FLAG_ACTION.SET_ROLLING_SUBSTITUTIONS:
      return merge_substitution_rules(overrides, {
        rolling_substitutions_allowed: value,
      });
    case SPORT_RULES_FLAG_ACTION.SET_RETURN_AFTER_SUBSTITUTION:
      return merge_substitution_rules(overrides, {
        return_after_substitution_allowed: value,
      });
    case SPORT_RULES_FLAG_ACTION.SET_OVERTIME_ENABLED:
      return {
        ...overrides,
        overtime_rules: { ...overrides.overtime_rules, is_enabled: value },
      };
  }
}

function apply_number_action(
  overrides: CompetitionRuleOverrides,
  type: SportRulesNumberAction,
  value: number,
): CompetitionRuleOverrides {
  switch (type) {
    case SPORT_RULES_NUMBER_ACTION.SET_MAX_PLAYERS:
      return { ...overrides, max_players_on_field: value };
    case SPORT_RULES_NUMBER_ACTION.SET_MIN_PLAYERS:
      return { ...overrides, min_players_on_field: value };
    case SPORT_RULES_NUMBER_ACTION.SET_MAX_SQUAD:
      return { ...overrides, max_squad_size: value };
    case SPORT_RULES_NUMBER_ACTION.SET_MAX_SUBSTITUTIONS:
      return merge_substitution_rules(overrides, {
        max_substitutions_per_game: value,
      });
  }
}

export function apply_sport_rules_override_action(
  overrides: CompetitionRuleOverrides,
  action: SportRulesOverrideAction,
): CompetitionRuleOverrides {
  switch (action.type) {
    case SPORT_RULES_STRUCTURE_ACTION.SET_PERIODS:
      return {
        ...overrides,
        periods: action.periods,
        game_duration_minutes: get_total_playing_time(action.periods),
      };
    case SPORT_RULES_STRUCTURE_ACTION.RESET_SECTION:
      return reset_section(overrides, action.section);
    case SPORT_RULES_FLAG_ACTION.SET_ROLLING_SUBSTITUTIONS:
    case SPORT_RULES_FLAG_ACTION.SET_RETURN_AFTER_SUBSTITUTION:
    case SPORT_RULES_FLAG_ACTION.SET_OVERTIME_ENABLED:
      return apply_flag_action(overrides, action.type, action.value);
    case SPORT_RULES_NUMBER_ACTION.SET_MAX_PLAYERS:
    case SPORT_RULES_NUMBER_ACTION.SET_MIN_PLAYERS:
    case SPORT_RULES_NUMBER_ACTION.SET_MAX_SQUAD:
    case SPORT_RULES_NUMBER_ACTION.SET_MAX_SUBSTITUTIONS:
      return apply_number_action(overrides, action.type, action.value);
  }
}

export function create_sport_rules_customizing_state(): SportRulesCustomizingState {
  return {
    periods: false,
    squad_limits: false,
    substitutions: false,
    overtime: false,
  };
}

export function set_sport_rules_section_customizing(
  state: SportRulesCustomizingState,
  section: SportRulesSection,
  is_customizing: boolean,
): SportRulesCustomizingState {
  return { ...state, [section]: is_customizing };
}
