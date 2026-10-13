import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { StageType } from "./CompetitionStage";
import type { FormatTypeValue } from "./StatusConstants";

export type FormatType = FormatTypeValue;

export const TIE_BREAKER = {
  GOAL_DIFFERENCE: "goal_difference",
  HEAD_TO_HEAD: "head_to_head",
  GOALS_SCORED: "goals_scored",
  AWAY_GOALS: "away_goals",
  FAIR_PLAY: "fair_play",
  DRAW: "draw",
  PLAYOFF: "playoff",
} as const;

export type TieBreaker = (typeof TIE_BREAKER)[keyof typeof TIE_BREAKER];

export interface GroupStageConfig {
  number_of_groups: number;
  teams_per_group: number;
  teams_advancing_per_group: number;
  matches_per_round: number;
}

export interface KnockoutStageConfig {
  number_of_rounds: number;
  third_place_match: boolean;
  two_legged_ties: boolean;
  away_goals_rule: boolean;
  extra_time_enabled: boolean;
  penalty_shootout_enabled: boolean;
}

export interface PointsConfig {
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  points_for_win: 3,
  points_for_draw: 1,
  points_for_loss: 0,
};

export interface LeagueConfig {
  number_of_rounds: number;
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
  promotion_spots: number;
  relegation_spots: number;
  playoff_spots: number;
}

export interface CompetitionFormatStageTemplate {
  name: Name;
  stage_type: StageType;
  stage_order: number;
}

export interface CompetitionFormat extends BaseEntity {
  name: Name;
  code: string;
  description: string;
  format_type: FormatType;
  points_config: PointsConfig;
  tie_breakers: TieBreaker[];
  group_stage_config: GroupStageConfig;
  knockout_stage_config: KnockoutStageConfig;
  league_config: LeagueConfig;
  stage_templates: CompetitionFormatStageTemplate[];
  min_teams_required: number;
  max_teams_allowed: number;
  status: EntityStatus;
  organization_id?: EntityId;
}

export type CreateCompetitionFormatInput = Omit<
  ScalarInput<CompetitionFormat>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateCompetitionFormatInput =
  Partial<CreateCompetitionFormatInput>;
