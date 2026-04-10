import {
  create_default_card_types,
  create_default_football_periods,
  create_default_foul_categories,
  create_default_official_requirements,
  create_default_overtime_rules,
  create_default_scoring_rules,
  create_default_substitution_rules,
} from "./SportDefaults";
import type {
  CreateSportInput,
  OfficialRequirement,
  SportGamePeriod,
} from "./SportTypes";

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
    status: "active",
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
    status: "active",
  };
}

export function validate_sport_input(input: CreateSportInput): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Sport name must be at least 2 characters");
  }

  if (!input.code || input.code.trim().length < 2) {
    validation_errors.push("Sport code must be at least 2 characters");
  }

  if (input.standard_game_duration_minutes < 1) {
    validation_errors.push("Game duration must be at least 1 minute");
  }

  if (!input.periods || input.periods.length === 0) {
    validation_errors.push("At least one game period is required");
  }

  const mandatory_officials = input.official_requirements.filter(
    (r) => r.is_mandatory,
  );
  if (mandatory_officials.length === 0) {
    validation_errors.push("At least one mandatory official role is required");
  }

  if (input.max_players_on_field < input.min_players_on_field) {
    validation_errors.push(
      "Maximum players on field must be >= minimum players",
    );
  }

  if (input.max_squad_size < input.max_players_on_field) {
    validation_errors.push(
      "Maximum squad size must be >= maximum players on field",
    );
  }

  return validation_errors;
}

function calculate_total_game_duration(periods: SportGamePeriod[]): number {
  return periods
    .filter((p) => !p.is_break)
    .reduce((total, period) => total + period.duration_minutes, 0);
}

function get_mandatory_official_count(
  requirements: OfficialRequirement[],
): number {
  return requirements
    .filter((r) => r.is_mandatory)
    .reduce((total, r) => total + r.minimum_count, 0);
}
