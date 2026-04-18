import type { Competition } from "$lib/core/entities/Competition";
import {
  type Fixture,
  type GamePeriod,
  type QuickEventButton,
} from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Sport, SportGamePeriod } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";
import { type PeriodButtonConfig } from "$lib/presentation/logic/liveGameDetailState";

export interface LiveGameDetailPageState {
  fixture?: Fixture;
  home_team?: Team;
  away_team?: Team;
  competition?: Competition;
  sport?: Sport;
  venue?: Venue;
  organization_name: string;
  assigned_officials_data: Array<{
    official: Official;
    role_name: string;
  }>;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
  home_lineup_id: string;
  away_lineup_id: string;
  is_loading: boolean;
  error_message: string;
  is_updating: boolean;
  game_clock_seconds: number;
  is_clock_running: boolean;
  extra_time_added_seconds: number;
  extra_minutes_to_add: number;
  break_elapsed_seconds: number;
  downloading_report: boolean;
  can_modify_game: boolean;
  permission_info_message: string;
  home_lineup_expanded: boolean;
  away_lineup_expanded: boolean;
}

export interface LiveGameDetailModalState {
  show_start_modal: boolean;
  show_end_modal: boolean;
  show_period_modal: boolean;
  show_extra_time_modal: boolean;
}

export interface LiveGameDetailEventState {
  show_event_modal: boolean;
  selected_event_type?: QuickEventButton;
  selected_team_side: "home" | "away";
  selected_player_id: string;
  secondary_player_id: string;
  event_player_name: string;
  secondary_player_name: string;
  event_description: string;
  event_minute: number;
}

export interface LiveGameDetailToastState {
  is_visible: boolean;
  message: string;
  type: "success" | "error" | "info";
}

export interface LiveGameDetailDerivedState {
  effective_periods: SportGamePeriod[];
  playing_periods: SportGamePeriod[];
  current_period_id?: GamePeriod;
  current_period_label: string;
  is_current_period_playing: boolean;
  elapsed_minutes: number;
  home_starters: LineupPlayer[];
  home_substitutes: LineupPlayer[];
  away_starters: LineupPlayer[];
  away_substitutes: LineupPlayer[];
  remaining_seconds_in_period: number;
  clock_display: string;
  home_score: number;
  away_score: number;
  sorted_events: Fixture["game_events"];
  is_game_active: boolean;
  is_game_completed: boolean;
  period_button_config?: PeriodButtonConfig;
  show_extra_time_button: boolean;
  all_event_buttons: QuickEventButton[];
  player_select_options: Array<{ value: string; label: string }>;
  players_on_field_options: Array<{ value: string; label: string }>;
  is_substitution_event: boolean;
  assigned_officials: Array<{ name: string; role_name: string }>;
  team_names: Record<string, string>;
  venue_name: string;
  venue_location: string;
  home_team_short_name: string;
  away_team_short_name: string;
  home_team_color: string;
  away_team_color: string;
  officials_color: string;
}

export {
  derive_live_game_detail_view_state,
  get_live_game_page_title,
} from "./liveGameDetailPageDerivedState";
export {
  apply_live_game_detail_bundle,
  create_live_game_detail_event_state,
  create_live_game_detail_modal_state,
  create_live_game_detail_page_state,
  create_live_game_detail_toast_state,
  get_live_game_detail_event_player,
  open_live_game_detail_event_state,
} from "./liveGameDetailPageStateFactories";
