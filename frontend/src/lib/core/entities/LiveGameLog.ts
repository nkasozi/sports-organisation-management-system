import type {
  EntityId,
  GameMinute,
  IsoDateTimeString,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { GamePeriod } from "./Fixture";

export type LiveGameStatus =
  | "pre_game"
  | "in_progress"
  | "paused"
  | "completed"
  | "abandoned";

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

function create_empty_live_game_log_input(
  organization_id: CreateLiveGameLogInput["organization_id"] = "",
  fixture_id: CreateLiveGameLogInput["fixture_id"] = "",
): CreateLiveGameLogInput {
  return {
    organization_id,
    fixture_id,
    home_lineup_id: "",
    away_lineup_id: "",
    current_period: "pre_game",
    game_status: "pre_game",
    started_by_user_id: "",
    notes: "",
    status: "active",
  };
}

function validate_live_game_log_input(
  input: CreateLiveGameLogInput | UpdateLiveGameLogInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if ("organization_id" in input && !input.organization_id?.trim()) {
    errors.organization_id = "Organization is required";
  }

  if ("fixture_id" in input && !input.fixture_id?.trim()) {
    errors.fixture_id = "Fixture is required";
  }

  if (
    "game_status" in input &&
    input.game_status &&
    !(
      [
        "pre_game",
        "in_progress",
        "paused",
        "completed",
        "abandoned",
      ] as LiveGameStatus[]
    ).includes(input.game_status)
  ) {
    errors.game_status = "Invalid game status";
  }

  if (
    "home_team_score" in input &&
    typeof input.home_team_score === "number" &&
    input.home_team_score < 0
  ) {
    errors.home_team_score = "Home team score cannot be negative";
  }

  if (
    "away_team_score" in input &&
    typeof input.away_team_score === "number" &&
    input.away_team_score < 0
  ) {
    errors.away_team_score = "Away team score cannot be negative";
  }

  if (
    "current_minute" in input &&
    typeof input.current_minute === "number" &&
    input.current_minute < 0
  ) {
    errors.current_minute = "Current minute cannot be negative";
  }

  return {
    is_valid: Object.keys(errors).length === 0,
    errors,
  };
}

function get_live_game_log_display(log: LiveGameLog): string {
  const score = `${log.home_team_score} - ${log.away_team_score}`;
  const minute = log.current_minute > 0 ? `${log.current_minute}'` : "";
  const status_label = get_live_game_status_label(log.game_status);
  return `${score} ${minute} (${status_label})`.trim();
}

function get_live_game_status_label(status: LiveGameStatus): string {
  const labels: Record<LiveGameStatus, string> = {
    pre_game: "Pre-Game",
    in_progress: "In Progress",
    paused: "Paused",
    completed: "Full Time",
    abandoned: "Abandoned",
  };
  return labels[status] || status;
}

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
