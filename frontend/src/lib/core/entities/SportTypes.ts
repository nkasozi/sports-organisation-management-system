import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export type CardType = {
  id: string;
  name: Name;
  color: string;
  severity: "warning" | "ejection" | "suspension";
  description: string;
  consequences: string[];
};

export type FoulCategory = {
  id: string;
  name: Name;
  severity: "minor" | "moderate" | "major" | "severe";
  description: string;
  typical_penalty: string;
  results_in_card: string;
};

export type PenaltiesConfig = {
  initial_rounds: number;
  sudden_death_after: boolean;
};

export type SportGamePeriod = {
  id: string;
  name: Name;
  duration_minutes: number;
  is_break: boolean;
  order: number;
};

export type OfficialRequirement = {
  role_id: EntityId;
  role_name: Name;
  minimum_count: number;
  maximum_count: number;
  is_mandatory: boolean;
  description: string;
};

export type OvertimeRule = {
  is_enabled: boolean;
  trigger_condition: "draw" | "knockout_draw" | "never";
  overtime_type:
    | "extra_time"
    | "golden_goal"
    | "silver_goal"
    | "penalties"
    | "replay"
    | "shootout";
  extra_time_periods: SportGamePeriod[];
  penalties_config: PenaltiesConfig;
};

export type ScoringRule = {
  event_type: string;
  points_awarded: number;
  description: string;
};

export type SubstitutionRule = {
  max_substitutions_per_game: number;
  max_substitution_windows: number;
  rolling_substitutions_allowed: boolean;
  return_after_substitution_allowed: boolean;
};

export type SportStatus = "active" | "inactive" | "archived";

export interface Sport extends BaseEntity {
  name: Name;
  code: string;
  description: string;
  icon_url: string;

  standard_game_duration_minutes: number;
  periods: SportGamePeriod[];

  card_types: CardType[];
  foul_categories: FoulCategory[];

  official_requirements: OfficialRequirement[];

  overtime_rules: OvertimeRule;

  scoring_rules: ScoringRule[];

  substitution_rules: SubstitutionRule;

  max_players_on_field: number;
  min_players_on_field: number;
  max_squad_size: number;
  min_players_per_fixture: number;
  max_players_per_fixture: number;

  additional_rules: Record<string, string | number | boolean>;

  status: SportStatus;
}

export type CreateSportInput = Omit<
  ScalarInput<Sport>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateSportInput = Partial<CreateSportInput>;
