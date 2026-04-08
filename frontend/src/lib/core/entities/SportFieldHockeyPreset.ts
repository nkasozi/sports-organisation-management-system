import {
  FIELD_HOCKEY_CARD_TYPES,
  FIELD_HOCKEY_FOUL_CATEGORIES,
  FIELD_HOCKEY_OFFICIAL_REQUIREMENTS,
  FIELD_HOCKEY_OVERTIME_RULES,
  FIELD_HOCKEY_PERIODS,
  FIELD_HOCKEY_SCORING_RULES,
  FIELD_HOCKEY_SUBSTITUTION_RULES,
} from "./SportFieldHockeyPresetConfig";
import type { CreateSportInput } from "./SportTypes";

export function create_field_hockey_sport_preset(): CreateSportInput {
  return {
    name: "Field Hockey",
    code: "FIELD_HOCKEY",
    description: "Field Hockey with international FIH rules",
    icon_url: "🏑",
    standard_game_duration_minutes: 60,
    periods: FIELD_HOCKEY_PERIODS,
    card_types: FIELD_HOCKEY_CARD_TYPES,
    foul_categories: FIELD_HOCKEY_FOUL_CATEGORIES,
    official_requirements: FIELD_HOCKEY_OFFICIAL_REQUIREMENTS,
    overtime_rules: FIELD_HOCKEY_OVERTIME_RULES,
    scoring_rules: FIELD_HOCKEY_SCORING_RULES,
    substitution_rules: FIELD_HOCKEY_SUBSTITUTION_RULES,
    max_players_on_field: 11,
    min_players_on_field: 11,
    max_squad_size: 16,
    min_players_per_fixture: 11,
    max_players_per_fixture: 16,
    additional_rules: {
      minimum_hitting_distance: 5,
      penalty_corner_enabled: true,
      self_pass_allowed: true,
    },
    status: "active",
  };
}
