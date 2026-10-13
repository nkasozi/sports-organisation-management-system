import {
  create_default_card_types,
  create_default_football_periods,
  create_default_foul_categories,
  create_default_official_requirements,
  create_default_overtime_rules,
  create_default_scoring_rules,
  create_default_substitution_rules,
} from "./SportDefaults";
import { type CreateSportInput, SPORT_STATUS } from "./SportTypes";

export function create_empty_sport_input(): CreateSportInput {
  return {
    name: "",
    code: "",
    description: "",
    icon_url: "",
    standard_game_duration_minutes: 90,
    periods: create_default_football_periods(),
    card_types: create_default_card_types(),
    foul_categories: create_default_foul_categories(),
    official_requirements: create_default_official_requirements(),
    overtime_rules: create_default_overtime_rules(),
    scoring_rules: create_default_scoring_rules(),
    substitution_rules: create_default_substitution_rules(),
    max_players_on_field: 11,
    min_players_on_field: 7,
    max_squad_size: 23,
    min_players_per_fixture: 11,
    max_players_per_fixture: 18,
    additional_rules: {},
    status: SPORT_STATUS.ACTIVE,
  };
}

export function create_football_sport_preset(): CreateSportInput {
  return {
    name: "Football (Soccer)",
    code: "FOOTBALL",
    description: "Association football, commonly known as soccer",
    icon_url: "⚽",
    standard_game_duration_minutes: 90,
    periods: create_default_football_periods(),
    card_types: create_default_card_types(),
    foul_categories: create_default_foul_categories(),
    official_requirements: create_default_official_requirements(),
    overtime_rules: create_default_overtime_rules(),
    scoring_rules: create_default_scoring_rules(),
    substitution_rules: create_default_substitution_rules(),
    max_players_on_field: 11,
    min_players_on_field: 7,
    max_squad_size: 23,
    min_players_per_fixture: 11,
    max_players_per_fixture: 18,
    additional_rules: {
      offside_rule_enabled: true,
      goal_line_technology_enabled: false,
      var_enabled: false,
    },
    status: SPORT_STATUS.ACTIVE,
  };
}

type SportInputRule = {
  is_broken: (input: CreateSportInput) => boolean;
  message: string;
};

const SPORT_INPUT_RULES: readonly SportInputRule[] = [
  {
    is_broken: (input) => !input.name || input.name.trim().length < 2,
    message: "Sport name must be at least 2 characters",
  },
  {
    is_broken: (input) => !input.code || input.code.trim().length < 2,
    message: "Sport code must be at least 2 characters",
  },
  {
    is_broken: (input) => input.standard_game_duration_minutes < 1,
    message: "Game duration must be at least 1 minute",
  },
  {
    is_broken: (input) => !input.periods || input.periods.length === 0,
    message: "At least one game period is required",
  },
  {
    is_broken: (input) =>
      !input.official_requirements.some((role) => role.is_mandatory),
    message: "At least one mandatory official role is required",
  },
  {
    is_broken: (input) =>
      input.max_players_on_field < input.min_players_on_field,
    message: "Maximum players on field must be >= minimum players",
  },
  {
    is_broken: (input) => input.max_squad_size < input.max_players_on_field,
    message: "Maximum squad size must be >= maximum players on field",
  },
  {
    is_broken: (input) =>
      input.min_players_per_fixture < input.min_players_on_field,
    message: "Minimum players per fixture must be >= minimum players on field",
  },
  {
    is_broken: (input) =>
      input.max_players_per_fixture < input.min_players_per_fixture,
    message:
      "Maximum players per fixture must be >= minimum players per fixture",
  },
  {
    is_broken: (input) => input.max_players_per_fixture > input.max_squad_size,
    message: "Maximum players per fixture must be <= maximum squad size",
  },
];

export function validate_sport_input(input: CreateSportInput): string[] {
  return SPORT_INPUT_RULES.filter((rule) => rule.is_broken(input)).map(
    (rule) => rule.message,
  );
}
