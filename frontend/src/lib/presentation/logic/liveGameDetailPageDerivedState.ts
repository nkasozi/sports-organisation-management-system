import { build_sport_event_buttons } from "$lib/core/entities/SportEventCatalog";
import { resolve_sport_event_source } from "$lib/core/entities/SportEventSource";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import {
  build_player_select_options_for_team,
  build_players_on_field_options,
  get_starters_from_lineup,
  get_substitutes_from_lineup,
} from "$lib/presentation/logic/liveGameDetailState";

import { derive_live_game_detail_clock_state } from "./liveGameDetailPageClockState";
import { derive_live_game_detail_presentation_state } from "./liveGameDetailPagePresentationState";
import type {
  LiveGameDetailDerivedState,
  LiveGameDetailEventState,
  LiveGameDetailPageState,
} from "./liveGameDetailPageState";

const SUBSTITUTION_EVENT_ID = "substitution";

function sort_game_events(
  page_state: LiveGameDetailPageState,
): LiveGameDetailDerivedState["sorted_events"] {
  return [...(page_state.fixture?.game_events ?? [])].sort(
    (left, right) =>
      left.minute - right.minute ||
      new Date(left.recorded_at).getTime() -
        new Date(right.recorded_at).getTime(),
  );
}

function derive_live_game_detail_lineup_and_event_state(
  page_state: LiveGameDetailPageState,
  event_state: LiveGameDetailEventState,
): Omit<
  LiveGameDetailDerivedState,
  | keyof ReturnType<typeof derive_live_game_detail_clock_state>
  | keyof ReturnType<typeof derive_live_game_detail_presentation_state>
> {
  const { home_players, away_players, fixture } = page_state;
  const team_side = event_state.selected_team_side;
  return {
    home_starters: get_starters_from_lineup(home_players),
    home_substitutes: get_substitutes_from_lineup(home_players),
    away_starters: get_starters_from_lineup(away_players),
    away_substitutes: get_substitutes_from_lineup(away_players),
    home_score: fixture?.home_team_score ?? 0,
    away_score: fixture?.away_team_score ?? 0,
    sorted_events: sort_game_events(page_state),
    is_game_active: fixture?.status === FIXTURE_STATUS.IN_PROGRESS,
    is_game_completed: fixture?.status === FIXTURE_STATUS.COMPLETED,
    all_event_buttons: build_sport_event_buttons(
      resolve_sport_event_source(page_state.sport, page_state.competition),
    ),
    player_select_options: build_player_select_options_for_team(
      team_side,
      home_players,
      away_players,
    ),
    players_on_field_options: build_players_on_field_options(
      team_side,
      home_players,
      away_players,
    ),
    is_substitution_event:
      event_state.selected_event_type?.id === SUBSTITUTION_EVENT_ID,
  };
}

export function derive_live_game_detail_view_state(command: {
  event_state: LiveGameDetailEventState;
  page_state: LiveGameDetailPageState;
}): LiveGameDetailDerivedState {
  return {
    ...derive_live_game_detail_clock_state(command.page_state),
    ...derive_live_game_detail_lineup_and_event_state(
      command.page_state,
      command.event_state,
    ),
    ...derive_live_game_detail_presentation_state(command.page_state),
  };
}

export function get_live_game_page_title(
  page_state: LiveGameDetailPageState,
): string {
  return page_state.fixture
    ? `${page_state.home_team?.name ?? "Home"} vs ${page_state.away_team?.name ?? "Away"}`
    : "Live Game Management";
}
