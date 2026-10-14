import {
  type Fixture,
  type QuickEventButton,
} from "$lib/core/entities/Fixture";
import type {
  LineupPlayer,
  PlayerTimeOnStatus,
} from "$lib/core/entities/FixtureLineup";
import { create_success_result, type Result } from "$lib/core/types/Result";
import {
  record_live_game_detail_timed_event,
  update_live_game_player_time_on,
} from "$lib/presentation/logic/liveGameDetailActions";

import {
  build_game_action_failure,
  GAME_ACTION_EVENT,
  GAME_ACTION_USER_MESSAGE,
} from "./gameActionMessages";
import { TEAM_SIDE } from "./gameEventConstants";
import type {
  FixtureLineupUseCases,
  FixtureUseCases,
} from "./liveGameDetailPageActionTypes";
import { save_live_game_substitution_lineup } from "./liveGameDetailSubstitutionLineup";
import {
  attribute_event_time,
  type AttributedEventTime,
  type EventTimingContext,
} from "./liveGameEventTiming";
import { validate_substitution } from "./liveGameOnFieldPlayers";
import type { PlayerAvailability } from "./liveGamePlayerAvailability";
import type { EffectiveSubstitutionRules } from "./liveGameSubstitutionRules";

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
  const is_home = command.team_side === TEAM_SIDE.HOME;
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

type RecordPageEventCommand = {
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
  secondary_player_id: string;
  on_field_players: LineupPlayer[];
  substitution_availability: PlayerAvailability;
  substitution_rules: EffectiveSubstitutionRules;
  max_players_on_field: number;
  event_timing: EventTimingContext;
  selected_event_type: QuickEventButton;
  selected_player_id: string;
  selected_team_side: "home" | "away";
};

type RecordPageEventSuccess = {
  fixture: Fixture;
  success: true;
  toast_message: string;
  updated_away_players: LineupPlayer[];
  updated_home_players: LineupPlayer[];
  warning_message: string;
};

async function apply_substitution_lineup(
  command: RecordPageEventCommand,
  fixture: Fixture,
): Promise<RecordPageEventSuccess> {
  const lineup_result = await save_live_game_substitution_lineup({
    team_side: command.selected_team_side,
    home_lineup_id: command.home_lineup_id,
    away_lineup_id: command.away_lineup_id,
    home_players: command.home_players,
    away_players: command.away_players,
    change: {
      player_on_id: command.selected_player_id,
      player_off_id: command.secondary_player_id,
      minute: String(command.event_minute),
    },
    fixture_lineup_use_cases: command.fixture_lineup_use_cases,
  });
  return {
    success: true,
    fixture,
    updated_home_players: lineup_result.updated_home_players,
    updated_away_players: lineup_result.updated_away_players,
    warning_message: lineup_result.error_message,
    toast_message: `${command.selected_event_type.label} recorded!`,
  };
}

function check_substitution(command: RecordPageEventCommand): Result<boolean> {
  if (!command.is_substitution_event) return create_success_result(true);
  return validate_substitution({
    on_field_players: command.on_field_players,
    player_on_id: command.selected_player_id,
    player_off_id: command.secondary_player_id,
    max_players_on_field: command.max_players_on_field,
    availability: command.substitution_availability,
    rules: command.substitution_rules,
  });
}

function record_page_event(
  command: RecordPageEventCommand,
  event_time: AttributedEventTime,
): ReturnType<typeof record_live_game_detail_timed_event> {
  return record_live_game_detail_timed_event({
    fixture_id: command.fixture_id,
    selected_event_type: command.selected_event_type,
    minute: event_time.minute,
    stoppage_time_minute: event_time.stoppage_time_minute,
    selected_team_side: command.selected_team_side,
    event_player_name: command.event_player_name,
    event_player_id: command.selected_player_id,
    event_description: command.event_description,
    secondary_player_name: command.secondary_player_name,
    secondary_player_id: command.secondary_player_id,
    period: event_time.period,
    fixture_use_cases: command.fixture_use_cases,
  });
}

export async function record_live_game_detail_page_event_action(
  command: RecordPageEventCommand,
): Promise<RecordPageEventSuccess | { error_message: string; success: false }> {
  const substitution_result = check_substitution(command);
  if (!substitution_result.success) {
    console.warn("[LiveGameDetail] Substitution rejected", {
      event: GAME_ACTION_EVENT.SUBSTITUTION_REJECTED,
      fixture_id: command.fixture_id,
    });
    return { success: false, error_message: substitution_result.error };
  }
  const event_time = attribute_event_time(
    command.event_minute,
    command.event_timing,
  );
  if (!event_time.success)
    return { success: false, error_message: event_time.error };
  const event_result = await record_page_event(command, event_time.data);
  if (!event_result.success)
    return build_game_action_failure({
      event: GAME_ACTION_EVENT.RECORD_EVENT_FAILED,
      fixture_id: command.fixture_id,
      technical_error: event_result.error,
      user_message: GAME_ACTION_USER_MESSAGE.RECORD_EVENT_FAILED,
    });
  if (!command.is_substitution_event || !command.selected_player_id)
    return {
      success: true,
      fixture: event_result.data,
      updated_home_players: command.home_players,
      updated_away_players: command.away_players,
      warning_message: "",
      toast_message: `${command.selected_event_type.label} recorded!`,
    };
  return apply_substitution_lineup(command, event_result.data);
}
