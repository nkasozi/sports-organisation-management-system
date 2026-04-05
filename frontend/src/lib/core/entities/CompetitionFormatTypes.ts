import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { StageType } from "./CompetitionStage";

export type FormatType =
  | "league"
  | "round_robin"
  | "groups_knockout"
  | "straight_knockout"
  | "groups_playoffs"
  | "double_elimination"
  | "swiss"
  | "custom";

export type TieBreaker =
  | "goal_difference"
  | "head_to_head"
  | "goals_scored"
  | "away_goals"
  | "fair_play"
  | "draw"
  | "playoff";

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
  name: string;
  stage_type: StageType;
  stage_order: number;
}

export interface CompetitionFormat extends BaseEntity {
  name: string;
  code: string;
  description: string;
  format_type: FormatType;
  points_config: PointsConfig;
  tie_breakers: TieBreaker[];
  group_stage_config: GroupStageConfig | null;
  knockout_stage_config: KnockoutStageConfig | null;
  league_config: LeagueConfig | null;
  stage_templates: CompetitionFormatStageTemplate[];
  min_teams_required: number;
  max_teams_allowed: number;
  status: EntityStatus;
  organization_id?: string;
}

export type CreateCompetitionFormatInput = Omit<
  CompetitionFormat,
  "id" | "created_at" | "updated_at"
>;
export type UpdateCompetitionFormatInput =
  Partial<CreateCompetitionFormatInput>;
