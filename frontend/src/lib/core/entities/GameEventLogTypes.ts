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
  organization_id: string;
  live_game_log_id: string;
  fixture_id: string;
  event_type: GameEventLogType;
  minute: number;
  stoppage_time_minute: number | null;
  team_side: TeamSide;
  player_id: string;
  player_name: string;
  secondary_player_id: string;
  secondary_player_name: string;
  description: string;
  affects_score: boolean;
  score_change_home: number;
  score_change_away: number;
  recorded_by_user_id: string;
  recorded_at: string;
  reviewed: boolean;
  reviewed_by_user_id: string;
  reviewed_at: string;
  voided: boolean;
  voided_reason: string;
  status: EntityStatus;
}

export type CreateGameEventLogInput = Omit<
  GameEventLog,
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
    GameEventLog,
    "id" | "created_at" | "updated_at" | "live_game_log_id" | "fixture_id"
  >
>;
