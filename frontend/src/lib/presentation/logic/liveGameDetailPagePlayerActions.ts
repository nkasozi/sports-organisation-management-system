import {
  type Fixture,
  type QuickEventButton,
} from "$lib/core/entities/Fixture";
import type {
  LineupPlayer,
  PlayerTimeOnStatus,
} from "$lib/core/entities/FixtureLineup";
import {
  record_live_game_detail_event,
  update_live_game_player_time_on,
} from "$lib/presentation/logic/liveGameDetailActions";

import type {
  FixtureLineupUseCases,
  FixtureUseCases,
} from "./liveGameDetailPageActionTypes";

export async function update_live_game_detail_player_time_on_action(command: {
  away_lineup_id: string;
  away_players: LineupPlayer[];
  fixture_lineup_use_cases: FixtureLineupUseCases;
  home_lineup_id: string;
  home_players: LineupPlayer[];
  new_time_on: PlayerTimeOnStatus;
  player_id: string;
  team_side: "home" | "away";
}): Promise<{
  error_message: string;
  success: boolean;
  updated_away_players: LineupPlayer[];
  updated_home_players: LineupPlayer[];
}> {
  const is_home = command.team_side === "home";
  const result = await update_live_game_player_time_on(
    is_home ? command.home_lineup_id : command.away_lineup_id,
    is_home ? command.home_players : command.away_players,
    command.player_id,
    command.new_time_on,
    command.fixture_lineup_use_cases,
  );
  return {
    success: result.success,
    updated_home_players: is_home
      ? result.updated_players
      : command.home_players,
    updated_away_players: is_home
      ? command.away_players
      : result.updated_players,
    error_message: result.success ? "" : result.error_message,
  };
}

export async function record_live_game_detail_page_event_action(command: {
  away_lineup_id: string;
  away_players: LineupPlayer[];
  event_description: string;
  event_minute: number;
  event_player_name: string;
  fixture_id: string;
  fixture_lineup_use_cases: FixtureLineupUseCases;
  fixture_use_cases: FixtureUseCases;
  home_lineup_id: string;
  home_players: LineupPlayer[];
  is_substitution_event: boolean;
  secondary_player_name: string;
  selected_event_type: QuickEventButton;
  selected_player_id: string;
  selected_team_side: "home" | "away";
}): Promise<
  | {
      fixture: Fixture;
      success: true;
      toast_message: string;
      updated_away_players: LineupPlayer[];
      updated_home_players: LineupPlayer[];
      warning_message: string;
    }
  | { error_message: string; success: false }
> {
  const event_result = await record_live_game_detail_event(
    command.fixture_id,
    command.selected_event_type,
    command.event_minute,
    command.selected_team_side,
    command.event_player_name,
    command.event_description,
    command.secondary_player_name,
    command.fixture_use_cases,
  );
  if (!event_result.success)
    return {
      success: false,
      error_message: `Failed to record event: ${event_result.error}`,
    };
  if (!command.is_substitution_event || !command.selected_player_id)
    return {
      success: true,
      fixture: event_result.data,
      updated_home_players: command.home_players,
      updated_away_players: command.away_players,
      warning_message: "",
      toast_message: `${command.selected_event_type.label} recorded!`,
    };
  const player_update_result =
    await update_live_game_detail_player_time_on_action({
      away_lineup_id: command.away_lineup_id,
      away_players: command.away_players,
      fixture_lineup_use_cases: command.fixture_lineup_use_cases,
      home_lineup_id: command.home_lineup_id,
      home_players: command.home_players,
      new_time_on: String(command.event_minute) as PlayerTimeOnStatus,
      player_id: command.selected_player_id,
      team_side: command.selected_team_side,
    });
  return {
    success: true,
    fixture: event_result.data,
    updated_home_players: player_update_result.updated_home_players,
    updated_away_players: player_update_result.updated_away_players,
    warning_message: player_update_result.error_message,
    toast_message: `${command.selected_event_type.label} recorded!`,
  };
}
