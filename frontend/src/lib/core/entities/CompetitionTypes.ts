import type {
  EntityId,
  IsoDateString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { PointsConfig, TieBreaker } from "./CompetitionFormat";
import type {
  CardType,
  FoulCategory,
  OfficialRequirement,
  OvertimeRule,
  ScoringRule,
  SportGamePeriod,
  SubstitutionRule,
} from "./Sport";

export type CompetitionDerivedStatus = "upcoming" | "active" | "completed";

export type SquadGenerationStrategy = "first_available" | "previous_match";

export interface CompetitionRuleOverrides {
  game_duration_minutes?: number;
  periods?: ScalarInput<SportGamePeriod>[];
  additional_card_types?: ScalarInput<CardType>[];
  additional_foul_categories?: ScalarInput<FoulCategory>[];
  official_requirements?: ScalarInput<OfficialRequirement>[];
  overtime_rules?: Partial<ScalarInput<OvertimeRule>>;
  scoring_rules?: ScalarInput<ScoringRule>[];
  substitution_rules?: Partial<ScalarInput<SubstitutionRule>>;
  max_players_on_field?: number;
  min_players_on_field?: number;
  max_squad_size?: number;
  points_config_override?: Partial<PointsConfig>;
  tie_breakers_override?: TieBreaker[];
  custom_rules?: Record<string, unknown>;
}

export interface Competition extends BaseEntity {
  name: Name;
  description: string;
  organization_id: EntityId;
  competition_format_id: EntityId;
  team_ids: EntityId[];
  allow_auto_squad_submission: boolean;
  squad_generation_strategy: SquadGenerationStrategy;
  allow_auto_fixture_details_setup: boolean;
  lineup_submission_deadline_hours: number;
  start_date: IsoDateString;
  end_date: IsoDateString;
  registration_deadline: IsoDateString;
  max_teams: number;
  entry_fee: number;
  prize_pool: number;
  location: string;
  rule_overrides: CompetitionRuleOverrides;
  status: EntityStatus;
}

export type CreateCompetitionInput = Omit<
  ScalarInput<Competition>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateCompetitionInput = Partial<CreateCompetitionInput>;
