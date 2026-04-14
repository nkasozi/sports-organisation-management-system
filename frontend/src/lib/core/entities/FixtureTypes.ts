import type {
  EntityId,
  GameMinute,
  IsoDateString,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export type FixtureStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "postponed"
  | "cancelled";

export type GamePeriod =
  | "pre_game"
  | "first_half"
  | "half_time"
  | "second_half"
  | "extra_time_first"
  | "extra_time_second"
  | "penalty_shootout"
  | "finished"
  | (string & {});

export type GameEventType =
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

export interface GameEvent {
  id: EntityId;
  event_type: GameEventType;
  minute: GameMinute;
  stoppage_time_minute: GameMinute | null;
  team_side: "home" | "away" | "match";
  player_name: Name;
  secondary_player_name: Name;
  description: string;
  recorded_at: IsoDateTimeString;
}

export interface AssignedOfficial {
  official_id: EntityId;
  role_id: EntityId;
  role_name: Name;
}

export interface JerseyColorAssignment {
  jersey_color_id: EntityId;
  main_color: string;
  nickname: Name;
}

export interface Fixture extends BaseEntity {
  organization_id: EntityId;
  competition_id: EntityId;
  round_number: number;
  round_name: Name;
  home_team_id: EntityId;
  away_team_id: EntityId;
  venue: string;
  scheduled_date: IsoDateString;
  scheduled_time: string;
  home_team_score: number | null;
  away_team_score: number | null;
  assigned_officials: AssignedOfficial[];
  game_events: GameEvent[];
  current_period: GamePeriod;
  current_minute: GameMinute;
  match_day: number;
  notes: string;
  stage_id: EntityId;
  status: FixtureStatus;
  home_team_name?: Name;
  away_team_name?: Name;
  home_team_jersey?: JerseyColorAssignment;
  away_team_jersey?: JerseyColorAssignment;
  officials_jersey?: JerseyColorAssignment;
  manual_importance_override?: number | null;
}

export type CreateFixtureInput = Omit<
  ScalarInput<Fixture>,
  | "id"
  | "created_at"
  | "updated_at"
  | "home_team_score"
  | "away_team_score"
  | "game_events"
  | "current_period"
  | "current_minute"
>;
export type UpdateFixtureInput = Partial<
  Omit<ScalarInput<Fixture>, "id" | "created_at" | "updated_at">
>;
