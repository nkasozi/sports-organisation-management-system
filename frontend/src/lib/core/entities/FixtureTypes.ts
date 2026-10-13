import type {
  EntityId,
  GameMinute,
  IsoDateString,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";
import type { GameEventLogType, TeamSide } from "./GameEventLogTypes";
import type { FixtureStatusValue, GamePeriodValue } from "./StatusConstants";

export type FixtureStatus = FixtureStatusValue;

export type GamePeriod = GamePeriodValue | (string & {});

export type GameEventType = GameEventLogType;

export interface GameEvent {
  id: EntityId;
  event_type: GameEventType;
  minute: GameMinute;
  stoppage_time_minute: GameMinute;
  team_side: TeamSide;
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
  home_team_score: number;
  away_team_score: number;
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
  manual_importance_override?: number;
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
