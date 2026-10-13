import type {
  EntityId,
  GameMinute,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export const GAME_EVENT_LOG_TYPE = {
  GOAL: "goal",
  OWN_GOAL: "own_goal",
  PENALTY_SCORED: "penalty_scored",
  PENALTY_MISSED: "penalty_missed",
  YELLOW_CARD: "yellow_card",
  GREEN_CARD: "green_card",
  RED_CARD: "red_card",
  SECOND_YELLOW: "second_yellow",
  SUBSTITUTION: "substitution",
  FOUL: "foul",
  OFFSIDE: "offside",
  CORNER: "corner",
  FREE_KICK: "free_kick",
  INJURY: "injury",
  VAR_REVIEW: "var_review",
  PERIOD_START: "period_start",
  PERIOD_END: "period_end",
} as const;

export type GameEventLogType =
  (typeof GAME_EVENT_LOG_TYPE)[keyof typeof GAME_EVENT_LOG_TYPE];

export const TEAM_SIDE = {
  HOME: "home",
  AWAY: "away",
  MATCH: "match",
} as const;

export type TeamSide = (typeof TEAM_SIDE)[keyof typeof TEAM_SIDE];

export interface GameEventLog extends BaseEntity {
  organization_id: EntityId;
  live_game_log_id: EntityId;
  fixture_id: EntityId;
  event_type: GameEventLogType;
  minute: GameMinute;
  stoppage_time_minute: GameMinute;
  team_side: TeamSide;
  player_id: EntityId;
  player_name: Name;
  secondary_player_id: EntityId;
  secondary_player_name: Name;
  description: string;
  affects_score: boolean;
  score_change_home: number;
  score_change_away: number;
  recorded_by_user_id: EntityId;
  recorded_at: IsoDateTimeString;
  reviewed: boolean;
  reviewed_by_user_id: EntityId;
  reviewed_at: IsoDateTimeString;
  voided: boolean;
  voided_reason: string;
  status: EntityStatus;
}

export type CreateGameEventLogInput = Omit<
  ScalarInput<GameEventLog>,
  | "id"
  | "created_at"
  | "updated_at"
  | "recorded_at"
  | "reviewed"
  | "reviewed_by_user_id"
  | "reviewed_at"
  | "voided"
  | "voided_reason"
>;

export type UpdateGameEventLogInput = Partial<
  Omit<
    ScalarInput<GameEventLog>,
    "id" | "created_at" | "updated_at" | "live_game_log_id" | "fixture_id"
  >
>;
