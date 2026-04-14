import type {
  EntityId,
  GameMinute,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type GameEventLogType =
  | "goal"
  | "own_goal"
  | "penalty_scored"
  | "penalty_missed"
  | "yellow_card"
  | "green_card"
  | "red_card"
  | "second_yellow"
  | "substitution"
  | "foul"
  | "offside"
  | "corner"
  | "free_kick"
  | "injury"
  | "var_review"
  | "period_start"
  | "period_end";

export type TeamSide = "home" | "away" | "match";

export interface GameEventLog extends BaseEntity {
  organization_id: EntityId;
  live_game_log_id: EntityId;
  fixture_id: EntityId;
  event_type: GameEventLogType;
  minute: GameMinute;
  stoppage_time_minute: GameMinute | null;
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
