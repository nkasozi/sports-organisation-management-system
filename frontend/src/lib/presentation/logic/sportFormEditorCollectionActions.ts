import type {
  CardType,
  CreateSportInput,
  FoulCategory,
  OfficialRequirement,
  ScoringRule,
  SportGamePeriod,
} from "$lib/core/entities/Sport";

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
