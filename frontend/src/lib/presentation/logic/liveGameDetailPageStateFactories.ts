import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { LiveGameDetailBundle } from "$lib/presentation/logic/liveGameDetailState";

import type {
  LiveGameDetailEventState,
  LiveGameDetailModalState,
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "./liveGameDetailPageState";

export function create_live_game_detail_page_state(): LiveGameDetailPageState {
  return {
    fixture: void 0,
    home_team: void 0,
    away_team: void 0,
    competition: void 0,
    sport: void 0,
    venue: void 0,
    organization_name: "",
    assigned_officials_data: [],
    home_players: [],
    away_players: [],
    home_lineup_id: "",
    away_lineup_id: "",
    is_loading: true,
    error_message: "",
    is_updating: false,
    game_clock_seconds: 0,
    is_clock_running: false,
    extra_time_added_seconds: 0,
    extra_minutes_to_add: 5,
    break_elapsed_seconds: 0,
    downloading_report: false,
    can_modify_game: false,
    permission_info_message: "",
    home_lineup_expanded: false,
    away_lineup_expanded: false,
  } as LiveGameDetailPageState;
}

export function create_live_game_detail_modal_state(): LiveGameDetailModalState {
  return {
    show_start_modal: false,
    show_end_modal: false,
    show_period_modal: false,
    show_extra_time_modal: false,
  };
}

export function create_live_game_detail_event_state(): LiveGameDetailEventState {
  return {
    show_event_modal: false,
    selected_team_side: "home",
    selected_player_id: "",
    secondary_player_id: "",
    event_player_name: "",
    secondary_player_name: "",
    event_description: "",
    event_minute: 0,
  } as LiveGameDetailEventState;
}

export function create_live_game_detail_toast_state(): LiveGameDetailToastState {
  return { is_visible: false, message: "", type: "info" };
}

export function apply_live_game_detail_bundle(
  page_state: LiveGameDetailPageState,
  bundle: LiveGameDetailBundle,
): LiveGameDetailPageState {
  return {
    ...page_state,
    fixture: bundle.fixture,
    home_team: bundle.home_team,
    away_team: bundle.away_team,
    competition: bundle.competition,
    sport: bundle.sport,
    venue: bundle.venue,
    organization_name: bundle.organization_name,
    assigned_officials_data: bundle.assigned_officials_data,
    home_players: bundle.home_players,
    away_players: bundle.away_players,
    home_lineup_id: bundle.home_lineup_id,
    away_lineup_id: bundle.away_lineup_id,
    game_clock_seconds: bundle.game_clock_seconds,
  };
}

export function open_live_game_detail_event_state(command: {
  elapsed_minutes: number;
  event_button: NonNullable<LiveGameDetailEventState["selected_event_type"]>;
  team_side: "home" | "away";
}): LiveGameDetailEventState {
  return {
    show_event_modal: true,
    selected_event_type: command.event_button,
    selected_team_side: command.team_side,
    selected_player_id: "",
    secondary_player_id: "",
    event_player_name: "",
    secondary_player_name: "",
    event_description: "",
    event_minute: command.elapsed_minutes,
  };
}

export function get_live_game_detail_event_player(command: {
  player_id: string;
  players: LineupPlayer[];
}): { player_id: string; player_name: string } {
  const player = command.players.find(
    (current_player) => current_player.id === command.player_id,
  );
  return {
    player_id: command.player_id,
    player_name: player ? `${player.first_name} ${player.last_name}` : "",
  };
}
