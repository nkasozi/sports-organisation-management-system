// Game-related entity definitions for sports management
// Follows coding rules: well-named variables, explicit types, stateless helpers

import type { BaseEntity } from "./BaseEntity";

export interface Game extends BaseEntity {
  attributes: {
    name: string;
    competition_id: string;
    home_team_id: string;
    away_team_id: string;
    scheduled_date: string;
    scheduled_time: string;
    venue?: string;
    game_status:
      | "scheduled"
      | "in_progress"
      | "completed"
      | "cancelled"
      | "postponed";
    home_team_score: number;
    away_team_score: number;
    current_period: number;
    total_periods: number;
    period_duration_minutes: number;
    started_at?: string;
    ended_at?: string;
    created_by_user_id: string;
  };
}

export interface GameAssignment extends BaseEntity {
  attributes: {
    game_id: string;
    official_id: string;
    assignment_role:
      | "referee"
      | "assistant_referee"
      | "fourth_official"
      | "timekeeper"
      | "scorekeeper";
    confirmed: boolean;
    assigned_at: string;
    assigned_by_user_id: string;
    notes?: string;
  };
}

export interface ActiveGame extends BaseEntity {
  attributes: {
    game_id: string;
    current_status:
      | "pre_game"
      | "first_half"
      | "half_time"
      | "second_half"
      | "extra_time"
      | "penalty_shootout"
      | "finished";
    current_minute: number;
    stoppage_time_minutes: number;
    home_team_score: number;
    away_team_score: number;
    last_event_timestamp: string;
    game_started_by_user_id: string;
  };
}

export interface GameEvent extends BaseEntity {
  attributes: {
    active_game_id: string;
    event_type:
      | "goal"
      | "yellow_card"
      | "red_card"
      | "substitution"
      | "penalty"
      | "corner"
      | "offside"
      | "foul"
      | "timeout"
      | "period_start"
      | "period_end";
    event_minute: number;
    stoppage_time_minute?: number;
    team_id: string;
    player_id?: string;
    secondary_player_id?: string; // For substitutions
    description: string;
    affects_score: boolean;
    score_change_home: number;
    score_change_away: number;
    recorded_by_user_id: string;
    recorded_at: string;
    reviewed: boolean;
    reviewed_by_user_id?: string;
    reviewed_at?: string;
  };
}

export interface PlayerGameStats extends BaseEntity {
  attributes: {
    game_id: string;
    player_id: string;
    team_id: string;
    minutes_played: number;
    goals_scored: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    fouls_committed: number;
    fouls_received: number;
    substituted_in: boolean;
    substituted_out: boolean;
    substitution_minute?: number;
    position_played: string;
    performance_rating?: number;
    notes?: string;
  };
}

export interface TeamGameStats extends BaseEntity {
  attributes: {
    game_id: string;
    team_id: string;
    final_score: number;
    possession_percentage: number;
    shots_on_target: number;
    shots_off_target: number;
    corners: number;
    fouls: number;
    yellow_cards: number;
    red_cards: number;
    penalties_awarded: number;
    penalties_scored: number;
    result: "win" | "loss" | "draw";
    points_awarded: number;
  };
}

// Helper functions for game management
export function create_new_game(
  competition_id: string,
  home_team_id: string,
  away_team_id: string,
  scheduled_date: string,
  scheduled_time: string,
  created_by_user_id: string,
): Partial<Game> {
  return {
    attributes: {
      name: `${home_team_id} vs ${away_team_id}`,
      competition_id,
      home_team_id,
      away_team_id,
      scheduled_date,
      scheduled_time,
      game_status: "scheduled",
      home_team_score: 0,
      away_team_score: 0,
      current_period: 0,
      total_periods: 2, // Default to 2 halves
      period_duration_minutes: 45, // Default to 45 minutes per half
      created_by_user_id,
    },
  };
}

export function start_active_game(
  game_id: string,
  started_by_user_id: string,
): Partial<ActiveGame> {
  return {
    attributes: {
      game_id,
      current_status: "first_half",
      current_minute: 0,
      stoppage_time_minutes: 0,
      home_team_score: 0,
      away_team_score: 0,
      last_event_timestamp: new Date().toISOString(),
      game_started_by_user_id: started_by_user_id,
    },
  };
}

export function record_game_event(
  active_game_id: string,
  event_type: GameEvent["attributes"]["event_type"],
  event_minute: number,
  team_id: string,
  description: string,
  recorded_by_user_id: string,
  player_id?: string,
  affects_score: boolean = false,
  score_change_home: number = 0,
  score_change_away: number = 0,
): Partial<GameEvent> {
  return {
    attributes: {
      active_game_id,
      event_type,
      event_minute,
      team_id,
      player_id,
      description,
      affects_score,
      score_change_home,
      score_change_away,
      recorded_by_user_id,
      recorded_at: new Date().toISOString(),
      reviewed: false,
    },
  };
}

export function calculate_updated_score(
  current_home_score: number,
  current_away_score: number,
  score_change_home: number,
  score_change_away: number,
): { new_home_score: number; new_away_score: number } {
  return {
    new_home_score: Math.max(0, current_home_score + score_change_home),
    new_away_score: Math.max(0, current_away_score + score_change_away),
  };
}

export function determine_game_result(
  home_score: number,
  away_score: number,
): "win" | "loss" | "draw" {
  if (home_score > away_score) return "win";
  if (home_score < away_score) return "loss";
  return "draw";
}

export function is_game_completed(
  status: ActiveGame["attributes"]["current_status"],
): boolean {
  return status === "finished";
}

export function can_record_events_in_game_status(
  status: ActiveGame["attributes"]["current_status"],
): boolean {
  return [
    "first_half",
    "second_half",
    "extra_time",
    "penalty_shootout",
  ].includes(status);
}
