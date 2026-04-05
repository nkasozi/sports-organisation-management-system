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
  id: string;
  event_type: GameEventType;
  minute: number;
  stoppage_time_minute: number | null;
  team_side: "home" | "away" | "match";
  player_name: string;
  secondary_player_name: string;
  description: string;
  recorded_at: string;
}

export interface AssignedOfficial {
  official_id: string;
  role_id: string;
  role_name: string;
}

export interface JerseyColorAssignment {
  jersey_color_id: string;
  main_color: string;
  nickname: string;
}

export interface Fixture extends BaseEntity {
  organization_id: string;
  competition_id: string;
  round_number: number;
  round_name: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  scheduled_date: string;
  scheduled_time: string;
  home_team_score: number | null;
  away_team_score: number | null;
  assigned_officials: AssignedOfficial[];
  game_events: GameEvent[];
  current_period: GamePeriod;
  current_minute: number;
  match_day: number;
  notes: string;
  stage_id: string;
  status: FixtureStatus;
  home_team_name?: string;
  away_team_name?: string;
  home_team_jersey?: JerseyColorAssignment;
  away_team_jersey?: JerseyColorAssignment;
  officials_jersey?: JerseyColorAssignment;
  manual_importance_override?: number | null;
}

export type CreateFixtureInput = Omit<
  Fixture,
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
  Omit<Fixture, "id" | "created_at" | "updated_at">
>;
