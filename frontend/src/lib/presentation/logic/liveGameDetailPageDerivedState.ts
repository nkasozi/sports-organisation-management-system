import { get_quick_event_buttons } from "$lib/core/entities/Fixture";
import {
  build_period_button_config,
  build_player_select_options_for_team,
  build_players_on_field_options,
  check_is_playing_period,
  get_current_period_duration_seconds,
  get_effective_periods_for,
  get_period_start_seconds,
  get_playing_periods,
  get_sport_period_display_name,
  get_starters_from_lineup,
  get_substitutes_from_lineup,
} from "$lib/presentation/logic/liveGameDetailState";

import type {
  LiveGameDetailDerivedState,
  LiveGameDetailEventState,
  LiveGameDetailPageState,
} from "./liveGameDetailPageState";

export function derive_live_game_detail_view_state(command: {
  event_state: LiveGameDetailEventState;
  page_state: LiveGameDetailPageState;
}): LiveGameDetailDerivedState {
  const effective_periods = get_effective_periods_for(
    command.page_state.sport,
    command.page_state.competition,
  );
  const playing_periods = get_playing_periods(effective_periods);
  const current_period_id =
    command.page_state.fixture?.current_period ?? void 0;
  const is_current_period_playing = check_is_playing_period(
    current_period_id,
    effective_periods,
  );
  const current_period_duration = !current_period_id
    ? 0
    : is_current_period_playing
      ? get_current_period_duration_seconds(current_period_id, playing_periods)
      : (effective_periods.find((period) => period.id === current_period_id)
          ?.duration_minutes || 5) * 60;
  const period_elapsed_seconds = !current_period_id
    ? 0
    : is_current_period_playing
      ? command.page_state.game_clock_seconds -
        get_period_start_seconds(current_period_id, playing_periods)
      : command.page_state.break_elapsed_seconds;
  const remaining_seconds_in_period = Math.max(
    0,
    current_period_duration +
      command.page_state.extra_time_added_seconds -
      period_elapsed_seconds,
  );
  return {
    effective_periods,
    playing_periods,
    current_period_id,
    current_period_label: current_period_id
      ? get_sport_period_display_name(current_period_id, effective_periods)
      : command.page_state.fixture?.status === "completed"
        ? "Full Time"
        : command.page_state.fixture?.scheduled_time || "",
    is_current_period_playing,
    elapsed_minutes: Math.floor(command.page_state.game_clock_seconds / 60),
    home_starters: get_starters_from_lineup(command.page_state.home_players),
    home_substitutes: get_substitutes_from_lineup(
      command.page_state.home_players,
    ),
    away_starters: get_starters_from_lineup(command.page_state.away_players),
    away_substitutes: get_substitutes_from_lineup(
      command.page_state.away_players,
    ),
    remaining_seconds_in_period,
    clock_display: `${String(Math.floor(remaining_seconds_in_period / 60)).padStart(2, "0")}:${String(remaining_seconds_in_period % 60).padStart(2, "0")}`,
    home_score: command.page_state.fixture?.home_team_score ?? 0,
    away_score: command.page_state.fixture?.away_team_score ?? 0,
    sorted_events: [...(command.page_state.fixture?.game_events ?? [])].sort(
      (left, right) =>
        left.minute - right.minute ||
        new Date(left.recorded_at).getTime() -
          new Date(right.recorded_at).getTime(),
    ),
    is_game_active: command.page_state.fixture?.status === "in_progress",
    is_game_completed: command.page_state.fixture?.status === "completed",
    period_button_config: build_period_button_config(
      command.page_state.fixture?.current_period,
      command.page_state.fixture?.status === "in_progress",
      effective_periods,
    ),
    show_extra_time_button:
      command.page_state.fixture?.status === "in_progress" &&
      remaining_seconds_in_period <= 300,
    all_event_buttons: get_quick_event_buttons(),
    player_select_options: build_player_select_options_for_team(
      command.event_state.selected_team_side,
      command.page_state.home_players,
      command.page_state.away_players,
    ),
    players_on_field_options: build_players_on_field_options(
      command.event_state.selected_team_side,
      command.page_state.home_players,
      command.page_state.away_players,
    ),
    is_substitution_event:
      command.event_state.selected_event_type?.id === "substitution",
    assigned_officials: command.page_state.assigned_officials_data.map(
      (assignment) => ({
        name: `${assignment.official.first_name} ${assignment.official.last_name}`,
        role_name: assignment.role_name,
      }),
    ),
    team_names: {
      [command.page_state.fixture?.home_team_id || "home"]:
        command.page_state.home_team?.name || "Home",
      [command.page_state.fixture?.away_team_id || "away"]:
        command.page_state.away_team?.name || "Away",
    },
    venue_name:
      command.page_state.venue?.name || command.page_state.fixture?.venue || "",
    venue_location: `${command.page_state.venue?.city || ""}${command.page_state.venue?.country ? `${command.page_state.venue?.city ? ", " : ""}${command.page_state.venue.country}` : ""}`,
    home_team_short_name:
      command.page_state.home_team?.name?.slice(0, 3).toUpperCase() || "HOM",
    away_team_short_name:
      command.page_state.away_team?.name?.slice(0, 3).toUpperCase() || "AWY",
    home_team_color:
      command.page_state.fixture?.home_team_jersey?.main_color || "#3b82f6",
    away_team_color:
      command.page_state.fixture?.away_team_jersey?.main_color || "#ef4444",
    officials_color:
      command.page_state.fixture?.officials_jersey?.main_color || "",
  };
}

export function get_live_game_page_title(
  page_state: LiveGameDetailPageState,
): string {
  return page_state.fixture
    ? `${page_state.home_team?.name ?? "Home"} vs ${page_state.away_team?.name ?? "Away"}`
    : "Live Game Management";
}
