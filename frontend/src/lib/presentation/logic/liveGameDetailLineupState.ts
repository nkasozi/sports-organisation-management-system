import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import {
  get_default_time_on_for_player,
  type LineupPlayer,
} from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";

import { TEAM_SIDE } from "./gameEventConstants";
import { derive_on_field_players } from "./liveGameOnFieldPlayers";
import type { CardSeverityRules } from "./liveGamePlayerAvailability";

export interface LiveGameDetailBundle {
  fixture: Fixture;
  home_team?: Team;
  away_team?: Team;
  competition?: Competition;
  sport?: Sport;
  stage?: CompetitionStage;
  organization_name: string;
  venue?: Venue;
  assigned_officials_data: Array<{ official: Official; role_name: string }>;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
  home_lineup_id: string;
  away_lineup_id: string;
  game_clock_seconds: number;
  extra_time_added_seconds: number;
  break_elapsed_seconds: number;
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

export function build_player_select_options_for_team(
  team_side: "home" | "away",
  home_lineup_players: LineupPlayer[],
  away_lineup_players: LineupPlayer[],
): Array<{ value: string; label: string }> {
  const players =
    team_side === TEAM_SIDE.HOME ? home_lineup_players : away_lineup_players;
  return players.map((player) => ({
    value: player.id,
    label: `#${player.jersey_number ?? "?"} ${player.first_name} ${player.last_name}`,
  }));
}

export function build_players_on_field_options(
  team_side: "home" | "away",
  home_players: LineupPlayer[],
  away_players: LineupPlayer[],
  game_events: GameEvent[],
  card_rules: CardSeverityRules,
): Array<{ value: string; label: string }> {
  const players = derive_on_field_players(
    team_side === TEAM_SIDE.HOME ? home_players : away_players,
    game_events,
    team_side,
    card_rules,
  );
  return players.map((player) => ({
    value: player.id,
    label: `#${player.jersey_number ?? "?"} ${player.first_name} ${player.last_name}`,
  }));
}
