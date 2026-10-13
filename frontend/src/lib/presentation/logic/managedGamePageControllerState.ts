import {
  get_quick_event_buttons,
  type QuickEventButton,
} from "$lib/core/entities/Fixture";
import {
  create_missing_managed_game_fixture_state,
  create_missing_managed_game_selected_event_type_state,
  create_missing_managed_game_team_state,
  create_present_managed_game_fixture_state,
  create_present_managed_game_selected_event_type_state,
  type ManagedGameBundle,
  type ManagedGameFixtureState,
  type ManagedGameSelectedEventTypeState,
  type ManagedGameTeamState,
} from "$lib/presentation/logic/managedGamePageTypes";

export {
  build_managed_game_page_title,
  derive_managed_game_view_state,
} from "./managedGamePageViewState";

export interface ManagedGamePageState {
  fixture: ManagedGameFixtureState;
  home_team: ManagedGameTeamState;
  away_team: ManagedGameTeamState;
  home_players: unknown[];
  away_players: unknown[];
  is_loading: boolean;
  error_message: string;
  is_updating: boolean;
  game_clock_seconds: number;
  is_clock_running: boolean;
  show_start_modal: boolean;
  show_end_modal: boolean;
  show_event_modal: boolean;
  selected_event_type: ManagedGameSelectedEventTypeState;
  selected_team_side: "home" | "away";
  event_player_name: string;
  event_description: string;
  event_minute: number;
  toast_visible: boolean;
  toast_message: string;
  toast_type: "success" | "error" | "info";
}

const managed_game_events = get_quick_event_buttons();

export const managed_game_primary_events = managed_game_events.slice(0, 8);
export const managed_game_secondary_events = managed_game_events.slice(8);

export function create_managed_game_page_state(): ManagedGamePageState {
  return {
    fixture: create_missing_managed_game_fixture_state(),
    home_team: create_missing_managed_game_team_state(),
    away_team: create_missing_managed_game_team_state(),
    home_players: [],
    away_players: [],
    is_loading: true,
    error_message: "",
    is_updating: false,
    game_clock_seconds: 0,
    is_clock_running: false,
    show_start_modal: false,
    show_end_modal: false,
    show_event_modal: false,
    selected_event_type:
      create_missing_managed_game_selected_event_type_state(),
    selected_team_side: "home",
    event_player_name: "",
    event_description: "",
    event_minute: 0,
    toast_visible: false,
    toast_message: "",
    toast_type: "info",
  };
}

export function apply_managed_game_bundle(
  state: ManagedGamePageState,
  bundle: ManagedGameBundle,
): ManagedGamePageState {
  return {
    ...state,
    fixture: create_present_managed_game_fixture_state(bundle.fixture),
    home_team: bundle.home_team,
    away_team: bundle.away_team,
    home_players: bundle.home_players,
    away_players: bundle.away_players,
    game_clock_seconds: bundle.game_clock_seconds,
  };
}

export function set_managed_game_toast(
  state: ManagedGamePageState,
  message: string,
  type: ManagedGamePageState["toast_type"],
): ManagedGamePageState {
  return {
    ...state,
    toast_visible: true,
    toast_message: message,
    toast_type: type,
  };
}

export function open_managed_game_event_modal(
  state: ManagedGamePageState,
  event_button: QuickEventButton,
  team_side: "home" | "away",
  elapsed_minutes: number,
): ManagedGamePageState {
  return {
    ...state,
    show_event_modal: true,
    selected_event_type:
      create_present_managed_game_selected_event_type_state(event_button),
    selected_team_side: team_side,
    event_player_name: "",
    event_description: "",
    event_minute: elapsed_minutes,
  };
}

export function close_managed_game_event_modal(
  state: ManagedGamePageState,
): ManagedGamePageState {
  return {
    ...state,
    show_event_modal: false,
    selected_event_type:
      create_missing_managed_game_selected_event_type_state(),
    event_player_name: "",
    event_description: "",
    event_minute: 0,
  };
}
