import {
  type Fixture,
  get_period_display_name,
  get_quick_event_buttons,
  type QuickEventButton,
} from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import {
  build_game_clock_state,
  sort_game_events,
} from "$lib/presentation/logic/gameManageState";
import type { ManagedGameBundle } from "$lib/presentation/logic/managedGamePageTypes";

export interface ManagedGamePageState {
  fixture: Fixture | null;
  home_team: Team | null;
  away_team: Team | null;
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
  selected_event_type: QuickEventButton | null;
  selected_team_side: "home" | "away";
  event_player_name: string;
  event_description: string;
  event_minute: number;
  toast_visible: boolean;
  toast_message: string;
  toast_type: "success" | "error" | "info";
}

export interface ManagedGamePageViewState {
  available_players: unknown[];
  away_score: number;
  away_team_name: string;
  clock_state: ReturnType<typeof build_game_clock_state>;
  current_period_label: string;
  home_score: number;
  home_team_name: string;
  is_game_active: boolean;
  sorted_events: Fixture["game_events"];
}

const managed_game_events = get_quick_event_buttons();

export const managed_game_primary_events = managed_game_events.slice(0, 8);
export const managed_game_secondary_events = managed_game_events.slice(8);

export function create_managed_game_page_state(): ManagedGamePageState {
  return {
    fixture: null,
    home_team: null,
    away_team: null,
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
    selected_event_type: null,
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
    fixture: bundle.fixture,
    home_team: bundle.home_team,
    away_team: bundle.away_team,
    home_players: bundle.home_players,
    away_players: bundle.away_players,
    game_clock_seconds: bundle.game_clock_seconds,
  };
}

export function set_managed_game_loading_error(
  state: ManagedGamePageState,
  error_message: string,
): ManagedGamePageState {
  return {
    ...state,
    error_message,
    is_loading: false,
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
    selected_event_type: event_button,
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
    selected_event_type: null,
    event_player_name: "",
    event_description: "",
    event_minute: 0,
  };
}

export function derive_managed_game_view_state(
  state: ManagedGamePageState,
): ManagedGamePageViewState {
  const clock_state = build_game_clock_state(
    state.game_clock_seconds,
    state.fixture?.current_period ?? "first_half",
  );
  return {
    available_players:
      state.selected_team_side === "home"
        ? state.home_players
        : state.away_players,
    away_score: state.fixture?.away_team_score ?? 0,
    away_team_name: state.away_team?.name ?? "Away",
    clock_state,
    current_period_label: get_period_display_name(
      state.fixture?.current_period ?? "first_half",
    ),
    home_score: state.fixture?.home_team_score ?? 0,
    home_team_name: state.home_team?.name ?? "Home",
    is_game_active: state.fixture?.status === "in_progress",
    sorted_events: sort_game_events(state.fixture?.game_events ?? []),
  };
}

export function build_managed_game_page_title(
  state: ManagedGamePageState,
): string {
  return state.fixture
    ? `${state.home_team?.name ?? "Home"} vs ${state.away_team?.name ?? "Away"}`
    : "Game Management";
}
