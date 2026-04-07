import {
  type CardType,
  create_basketball_sport_preset,
  create_field_hockey_sport_preset,
  create_football_sport_preset,
  type CreateSportInput,
  type FoulCategory,
  type OfficialRequirement,
  type ScoringRule,
  type Sport,
  type SportGamePeriod,
} from "$lib/core/entities/Sport";

export type SportPresetType = "football" | "basketball" | "field_hockey";

export const SPORT_FORM_SECTIONS = [
  { id: "basic", label: "Basic Info" },
  { id: "periods", label: "Game Periods" },
  { id: "cards", label: "Card Types" },
  { id: "fouls", label: "Foul Categories" },
  { id: "officials", label: "Officials" },
  { id: "scoring", label: "Scoring" },
  { id: "overtime", label: "Overtime" },
  { id: "substitutions", label: "Substitutions" },
] as const;

export const SPORT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const SPORT_CARD_SEVERITY_OPTIONS = [
  { value: "warning", label: "Warning" },
  { value: "ejection", label: "Ejection" },
  { value: "suspension", label: "Suspension" },
];

export const SPORT_FOUL_SEVERITY_OPTIONS = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "major", label: "Major" },
  { value: "severe", label: "Severe" },
];

export const SPORT_OVERTIME_TRIGGER_OPTIONS = [
  { value: "draw", label: "Any Draw" },
  { value: "knockout_draw", label: "Knockout Draw Only" },
  { value: "never", label: "Never" },
];

export const SPORT_OVERTIME_TYPE_OPTIONS = [
  { value: "extra_time", label: "Extra Time" },
  { value: "golden_goal", label: "Golden Goal" },
  { value: "silver_goal", label: "Silver Goal" },
  { value: "penalties", label: "Penalties" },
  { value: "replay", label: "Replay" },
  { value: "shootout", label: "Shootout" },
];

export function apply_sport_preset(
  preset_type: SportPresetType,
): CreateSportInput {
  switch (preset_type) {
    case "football":
      return create_football_sport_preset();
    case "basketball":
      return create_basketball_sport_preset();
    case "field_hockey":
      return create_field_hockey_sport_preset();
  }
}

export function generate_sport_identifier(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function add_game_period(form_data: CreateSportInput): CreateSportInput {
  const next_period: SportGamePeriod = {
    id: `period_${form_data.periods.length + 1}`,
    name: `Period ${form_data.periods.length + 1}`,
    duration_minutes: 15,
    is_break: false,
    order: form_data.periods.length + 1,
  };

  return { ...form_data, periods: [...form_data.periods, next_period] };
}

export function remove_game_period(
  form_data: CreateSportInput,
  index: number,
): CreateSportInput {
  const reordered_periods = form_data.periods
    .filter((_, current_index: number) => current_index !== index)
    .map((current_period: SportGamePeriod, current_index: number) => ({
      ...current_period,
      order: current_index + 1,
    }));

  return { ...form_data, periods: reordered_periods };
}

export function add_card_type(form_data: CreateSportInput): CreateSportInput {
  const next_card_type: CardType = {
    id: `card_${form_data.card_types.length + 1}`,
    name: "",
    color: "#FBBF24",
    severity: "warning",
    description: "",
    consequences: [],
  };

  return {
    ...form_data,
    card_types: [...form_data.card_types, next_card_type],
  };
}

export function remove_card_type(
  form_data: CreateSportInput,
  index: number,
): CreateSportInput {
  return {
    ...form_data,
    card_types: form_data.card_types.filter(
      (_, current_index: number) => current_index !== index,
    ),
  };
}

export function add_foul_category(
  form_data: CreateSportInput,
): CreateSportInput {
  const next_foul_category: FoulCategory = {
    id: `foul_${form_data.foul_categories.length + 1}`,
    name: "",
    severity: "minor",
    description: "",
    typical_penalty: "",
    results_in_card: null,
  };

  return {
    ...form_data,
    foul_categories: [...form_data.foul_categories, next_foul_category],
  };
}

export function remove_foul_category(
  form_data: CreateSportInput,
  index: number,
): CreateSportInput {
  return {
    ...form_data,
    foul_categories: form_data.foul_categories.filter(
      (_, current_index: number) => current_index !== index,
    ),
  };
}

export function add_official_requirement(
  form_data: CreateSportInput,
): CreateSportInput {
  const next_official_requirement: OfficialRequirement = {
    role_id: `official_${form_data.official_requirements.length + 1}`,
    role_name: "",
    minimum_count: 1,
    maximum_count: 1,
    is_mandatory: true,
    description: "",
  };

  return {
    ...form_data,
    official_requirements: [
      ...form_data.official_requirements,
      next_official_requirement,
    ],
  };
}

export function remove_official_requirement(
  form_data: CreateSportInput,
  index: number,
): CreateSportInput {
  return {
    ...form_data,
    official_requirements: form_data.official_requirements.filter(
      (_, current_index: number) => current_index !== index,
    ),
  };
}

export function add_scoring_rule(
  form_data: CreateSportInput,
): CreateSportInput {
  const next_scoring_rule: ScoringRule = {
    event_type: "",
    points_awarded: 1,
    description: "",
  };

  return {
    ...form_data,
    scoring_rules: [...form_data.scoring_rules, next_scoring_rule],
  };
}

export function remove_scoring_rule(
  form_data: CreateSportInput,
  index: number,
): CreateSportInput {
  return {
    ...form_data,
    scoring_rules: form_data.scoring_rules.filter(
      (_, current_index: number) => current_index !== index,
    ),
  };
}

export function create_sport_form_data_from_sport(
  sport: Sport,
): CreateSportInput {
  return {
    name: sport.name,
    code: sport.code,
    description: sport.description,
    icon_url: sport.icon_url,
    status: sport.status,
    standard_game_duration_minutes: sport.standard_game_duration_minutes,
    periods: sport.periods.map((current_period: SportGamePeriod) => ({
      ...current_period,
    })),
    card_types: sport.card_types.map((current_card_type: CardType) => ({
      ...current_card_type,
    })),
    foul_categories: sport.foul_categories.map(
      (current_foul_category: FoulCategory) => ({ ...current_foul_category }),
    ),
    official_requirements: sport.official_requirements.map(
      (current_requirement: OfficialRequirement) => ({
        ...current_requirement,
      }),
    ),
    overtime_rules: {
      ...sport.overtime_rules,
      extra_time_periods: sport.overtime_rules.extra_time_periods.map(
        (current_period: SportGamePeriod) => ({ ...current_period }),
      ),
      penalties_config: sport.overtime_rules.penalties_config
        ? { ...sport.overtime_rules.penalties_config }
        : null,
    },
    scoring_rules: sport.scoring_rules.map((current_rule: ScoringRule) => ({
      ...current_rule,
    })),
    substitution_rules: { ...sport.substitution_rules },
    max_players_on_field: sport.max_players_on_field,
    min_players_on_field: sport.min_players_on_field,
    max_squad_size: sport.max_squad_size,
    min_players_per_fixture: sport.min_players_per_fixture,
    max_players_per_fixture: sport.max_players_per_fixture,
    additional_rules: { ...sport.additional_rules },
  };
}
