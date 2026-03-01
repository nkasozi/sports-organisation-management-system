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

export function create_empty_game_event_log_input(
  organization_id: string = "",
  live_game_log_id: string = "",
  fixture_id: string = "",
): CreateGameEventLogInput {
  return {
    organization_id,
    live_game_log_id,
    fixture_id,
    event_type: "goal",
    minute: 0,
    stoppage_time_minute: null,
    team_side: "home",
    player_id: "",
    player_name: "",
    secondary_player_id: "",
    secondary_player_name: "",
    description: "",
    affects_score: false,
    score_change_home: 0,
    score_change_away: 0,
    recorded_by_user_id: "",
    status: "active",
  };
}

export function validate_game_event_log_input(
  input: CreateGameEventLogInput | UpdateGameEventLogInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if ("organization_id" in input && !input.organization_id?.trim()) {
    errors.organization_id = "Organization is required";
  }

  if ("live_game_log_id" in input && !input.live_game_log_id?.trim()) {
    errors.live_game_log_id = "Live game log is required";
  }

  if ("fixture_id" in input && !input.fixture_id?.trim()) {
    errors.fixture_id = "Fixture is required";
  }

  if ("event_type" in input && !input.event_type?.trim()) {
    errors.event_type = "Event type is required";
  }

  if ("minute" in input && input.minute !== undefined) {
    if (input.minute < 0) {
      errors.minute = "Minute cannot be negative";
    }
    if (input.minute > 200) {
      errors.minute = "Minute value is too high";
    }
  }

  if ("team_side" in input && input.team_side) {
    const valid_sides: TeamSide[] = ["home", "away", "match"];
    if (!valid_sides.includes(input.team_side)) {
      errors.team_side = "Invalid team side";
    }
  }

  return {
    is_valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function get_game_event_log_display(event: GameEventLog): string {
  const minute_display =
    event.stoppage_time_minute !== null
      ? `${event.minute}+${event.stoppage_time_minute}'`
      : `${event.minute}'`;
  const player_display = event.player_name || "Unknown";
  const type_label = get_event_type_label(event.event_type);
  return `${minute_display} ${type_label} - ${player_display}`;
}

export function get_event_type_label(event_type: GameEventLogType): string {
  const labels: Record<GameEventLogType, string> = {
    goal: "Goal",
    own_goal: "Own Goal",
    penalty_scored: "Penalty Scored",
    penalty_missed: "Penalty Missed",
    yellow_card: "Yellow Card",
    green_card: "Green Card",
    red_card: "Red Card",
    second_yellow: "Second Yellow",
    substitution: "Substitution",
    foul: "Foul",
    offside: "Offside",
    corner: "Corner",
    free_kick: "Free Kick",
    injury: "Injury",
    var_review: "VAR Review",
    period_start: "Period Start",
    period_end: "Period End",
  };
  return labels[event_type] || event_type;
}

export function get_event_type_icon(event_type: GameEventLogType): string {
  const icons: Record<GameEventLogType, string> = {
    goal: "⚽",
    own_goal: "🥅",
    penalty_scored: "🎯",
    penalty_missed: "❌",
    yellow_card: "🟨",
    green_card: "🟩",
    red_card: "🟥",
    second_yellow: "🟨🟥",
    substitution: "🔄",
    foul: "⚠️",
    offside: "🚩",
    corner: "📐",
    free_kick: "🦵",
    injury: "🏥",
    var_review: "📺",
    period_start: "▶️",
    period_end: "⏸️",
  };
  return icons[event_type] || "📝";
}

export function is_scoring_event(event_type: GameEventLogType): boolean {
  return ["goal", "own_goal", "penalty_scored"].includes(event_type);
}

export function is_card_event(event_type: GameEventLogType): boolean {
  return ["yellow_card", "green_card", "red_card", "second_yellow"].includes(
    event_type,
  );
}

export const GAME_EVENT_TYPE_OPTIONS = [
  { value: "goal", label: "Goal" },
  { value: "own_goal", label: "Own Goal" },
  { value: "penalty_scored", label: "Penalty Scored" },
  { value: "penalty_missed", label: "Penalty Missed" },
  { value: "yellow_card", label: "Yellow Card" },
  { value: "green_card", label: "Green Card" },
  { value: "red_card", label: "Red Card" },
  { value: "second_yellow", label: "Second Yellow" },
  { value: "substitution", label: "Substitution" },
  { value: "foul", label: "Foul" },
  { value: "offside", label: "Offside" },
  { value: "corner", label: "Corner" },
  { value: "free_kick", label: "Free Kick" },
  { value: "injury", label: "Injury" },
  { value: "var_review", label: "VAR Review" },
  { value: "period_start", label: "Period Start" },
  { value: "period_end", label: "Period End" },
];

export const TEAM_SIDE_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "away", label: "Away" },
  { value: "match", label: "Match" },
];
