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
export {
  add_card_type,
  add_foul_category,
  add_game_period,
  add_official_requirement,
  add_scoring_rule,
  remove_card_type,
  remove_foul_category,
  remove_game_period,
  remove_official_requirement,
  remove_scoring_rule,
} from "$lib/presentation/logic/sportFormEditorCollectionActions";
export {
  SPORT_CARD_SEVERITY_OPTIONS,
  SPORT_FORM_SECTIONS,
  SPORT_FOUL_SEVERITY_OPTIONS,
  SPORT_OVERTIME_TRIGGER_OPTIONS,
  SPORT_OVERTIME_TYPE_OPTIONS,
  SPORT_STATUS_OPTIONS,
} from "$lib/presentation/logic/sportFormEditorConstants";

export type SportPresetType = "football" | "basketball" | "field_hockey";

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
