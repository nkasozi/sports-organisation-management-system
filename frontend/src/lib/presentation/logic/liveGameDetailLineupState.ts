import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import {
  get_default_time_on_for_player,
  type LineupPlayer,
  type PlayerTimeOnStatus,
} from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";

export interface LiveGameDetailBundle {
  fixture: Fixture;
  home_team: Team | null;
  away_team: Team | null;
  competition: Competition | null;
  sport: Sport | null;
  organization_name: string;
  venue: Venue | null;
  assigned_officials_data: Array<{ official: Official; role_name: string }>;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
  home_lineup_id: string;
  away_lineup_id: string;
  game_clock_seconds: number;
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
