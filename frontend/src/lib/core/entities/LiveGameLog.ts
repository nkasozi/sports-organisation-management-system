import type {
  EntityId,
  GameMinute,
  IsoDateTimeString,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { GamePeriod } from "./Fixture";
import type { GameStatusValue } from "./StatusConstants";

export type LiveGameStatus = GameStatusValue;

export interface LiveGameLog extends BaseEntity {
  organization_id: EntityId;
  fixture_id: EntityId;
  home_lineup_id: EntityId;
  away_lineup_id: EntityId;
  current_period: GamePeriod;
  current_minute: GameMinute;
  stoppage_time_minutes: GameMinute;
  clock_running: boolean;
  clock_paused_at_seconds: number;
  home_team_score: number;
  away_team_score: number;
  game_status: LiveGameStatus;
  started_at: IsoDateTimeString;
  ended_at: IsoDateTimeString;
  started_by_user_id: EntityId;
  ended_by_user_id: EntityId;
  notes: string;
  status: EntityStatus;
}

export type CreateLiveGameLogInput = Omit<
  ScalarInput<LiveGameLog>,
  | "id"
  | "created_at"
  | "updated_at"
  | "current_minute"
  | "stoppage_time_minutes"
  | "clock_running"
  | "clock_paused_at_seconds"
  | "home_team_score"
  | "away_team_score"
  | "started_at"
  | "ended_at"
  | "ended_by_user_id"
>;

export type UpdateLiveGameLogInput = Partial<
  Omit<
    ScalarInput<LiveGameLog>,
    "id" | "created_at" | "updated_at" | "fixture_id"
  >
>;

export const LIVE_GAME_STATUS_OPTIONS = [
  { value: "pre_game", label: "Pre-Game" },
  { value: "in_progress", label: "In Progress" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Full Time" },
  { value: "abandoned", label: "Abandoned" },
];

export const LIVE_GAME_PERIOD_OPTIONS = [
  { value: "pre_game", label: "Pre-Game" },
  { value: "first_half", label: "First Half" },
  { value: "half_time", label: "Half Time" },
  { value: "second_half", label: "Second Half" },
  { value: "extra_time_first", label: "Extra Time (1st)" },
  { value: "extra_time_second", label: "Extra Time (2nd)" },
  { value: "penalty_shootout", label: "Penalty Shootout" },
  { value: "finished", label: "Finished" },
];
