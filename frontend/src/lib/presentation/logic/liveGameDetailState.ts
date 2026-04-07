import type { Competition } from "$lib/core/entities/Competition";
import {
  type Fixture,
  type GameEvent,
  type GamePeriod,
  get_period_display_name,
} from "$lib/core/entities/Fixture";
import {
  get_default_time_on_for_player,
  type LineupPlayer,
  type PlayerTimeOnStatus,
} from "$lib/core/entities/FixtureLineup";
import type { Sport, SportGamePeriod } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";

export interface LiveGameDetailBundle {
  fixture: Fixture;
  home_team: Team | null;
  away_team: Team | null;
  competition: Competition | null;
  sport: Sport | null;
  organization_name: string;
  venue: unknown | null;
  assigned_officials_data: Array<{ official: unknown; role_name: string }>;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
  home_lineup_id: string;
  away_lineup_id: string;
  game_clock_seconds: number;
}

export interface PeriodButtonConfig {
  label: string;
  icon: string;
  is_end_action: boolean;
  next_period: GamePeriod;
  message: string;
  confirm_text: string;
}

export function normalize_lineup_players(
  players: LineupPlayer[],
): LineupPlayer[] {
  return players.map((player) => ({
    ...player,
    time_on:
      player.time_on ?? get_default_time_on_for_player(player.is_substitute),
  }));
}

export function get_time_on_options(
  current_minute: number,
): Array<{ value: string; label: string }> {
  return [
    { value: "present_at_start", label: "Present at Start" },
    { value: "didnt_play", label: "Didn't Play" },
    ...Array.from({ length: Math.max(current_minute, 90) }, (_, index) => ({
      value: String(index + 1),
      label: `${index + 1}'`,
    })),
  ];
}

export function get_starters_from_lineup(
  players: LineupPlayer[],
): LineupPlayer[] {
  return players.filter((player) => !player.is_substitute);
}
export function get_substitutes_from_lineup(
  players: LineupPlayer[],
): LineupPlayer[] {
  return players.filter((player) => player.is_substitute);
}
export function get_effective_periods_for(
  sport: Sport | null,
  competition: Competition | null,
): SportGamePeriod[] {
  return competition?.rule_overrides?.periods ?? sport?.periods ?? [];
}
export function get_playing_periods(
  periods: SportGamePeriod[],
): SportGamePeriod[] {
  return periods.filter((period) => !period.is_break);
}
export function get_period_start_seconds(
  period: GamePeriod,
  playing_periods: SportGamePeriod[],
): number {
  let start_seconds = 0;
  for (const playing_period of playing_periods) {
    if (playing_period.id === period) return start_seconds;
    start_seconds += playing_period.duration_minutes * 60;
  }
  return start_seconds;
}
export function get_current_period_duration_seconds(
  period: GamePeriod,
  playing_periods: SportGamePeriod[],
): number {
  const found_period = playing_periods.find(
    (playing_period) => playing_period.id === period,
  );
  return found_period
    ? found_period.duration_minutes * 60
    : playing_periods.length > 0
      ? playing_periods[0].duration_minutes * 60
      : 45 * 60;
}
export function build_missing_lineups_error_message(
  home_missing: boolean,
  away_missing: boolean,
  home_team_name: string,
  away_team_name: string,
): string {
  if (home_missing && away_missing)
    return `Both teams (${home_team_name} and ${away_team_name}) have not submitted their squads for this fixture.`;
  if (home_missing)
    return `${home_team_name} has not submitted their squad for this fixture.`;
  return `${away_team_name} has not submitted their squad for this fixture.`;
}
export function get_sport_period_display_name(
  period: GamePeriod,
  periods: SportGamePeriod[],
): string {
  const found = periods.find((current_period) => current_period.id === period);
  return found ? found.name : get_period_display_name(period);
}

export function build_period_button_config(
  current_period: GamePeriod | undefined,
  game_active: boolean,
  all_periods: SportGamePeriod[],
): PeriodButtonConfig | null {
  if (!current_period || !game_active || all_periods.length === 0) return null;
  const current_index = all_periods.findIndex(
    (period) => period.id === current_period,
  );
  if (current_index === -1) return null;
  const current = all_periods[current_index];
  if (!current.is_break) {
    const next_period =
      current_index + 1 < all_periods.length
        ? all_periods[current_index + 1]
        : null;
    return {
      label: `End ${current.name}`,
      icon: "⏹️",
      is_end_action: true,
      next_period: next_period?.id ?? "finished",
      message: `Are you sure you want to end ${current.name}?`,
      confirm_text: `End ${current.name}`,
    };
  }
  const next_playing_period = all_periods
    .slice(current_index + 1)
    .find((period) => !period.is_break);
  if (!next_playing_period) return null;
  return {
    label: `Start ${next_playing_period.name}`,
    icon: "▶️",
    is_end_action: false,
    next_period: next_playing_period.id as GamePeriod,
    message: `Are you sure you want to start ${next_playing_period.name}? The clock will resume.`,
    confirm_text: `Start ${next_playing_period.name}`,
  };
}

export function check_is_playing_period(
  period: GamePeriod | undefined,
  all_periods: SportGamePeriod[],
): boolean {
  if (!period) return false;
  if (period === "penalty_shootout") return true;
  if (all_periods.length === 0)
    return [
      "first_half",
      "second_half",
      "extra_time_first",
      "extra_time_second",
    ].includes(period);
  const found_period = all_periods.find(
    (current_period) => current_period.id === period,
  );
  return found_period ? !found_period.is_break : false;
}

export function get_event_bg_class(event: GameEvent): string {
  switch (event.event_type) {
    case "goal":
    case "penalty_scored":
      return "border-l-green-500 bg-green-50 dark:bg-green-900/20";
    case "own_goal":
      return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
    case "yellow_card":
      return "border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
    case "red_card":
    case "second_yellow":
      return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
    case "substitution":
      return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
    case "period_start":
    case "period_end":
      return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20";
    default:
      return "border-l-gray-300 bg-gray-50 dark:bg-accent-800";
  }
}

export function build_player_select_options_for_team(
  team_side: "home" | "away",
  home_lineup_players: LineupPlayer[],
  away_lineup_players: LineupPlayer[],
): Array<{ value: string; label: string }> {
  const players =
    team_side === "home" ? home_lineup_players : away_lineup_players;
  return players.map((player) => ({
    value: player.id,
    label: `#${player.jersey_number ?? "?"} ${player.first_name} ${player.last_name}`,
  }));
}

export function build_players_on_field_options(
  team_side: "home" | "away",
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
): Array<{ value: string; label: string }> {
  const players = (team_side === "home" ? home_players : away_players).filter(
    (player) =>
      player.time_on && player.time_on !== ("didnt_play" as PlayerTimeOnStatus),
  );
  return players.map((player) => ({
    value: player.id,
    label: `#${player.jersey_number ?? "?"} ${player.first_name} ${player.last_name}`,
  }));
}
