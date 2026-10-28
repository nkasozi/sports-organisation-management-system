import { build_sport_event_buttons } from "$lib/core/entities/SportEventCatalog";
import { resolve_sport_event_source } from "$lib/core/entities/SportEventSource";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import {
  build_player_select_options_for_team,
  build_players_on_field_options,
  get_starters_from_lineup,
  get_substitutes_from_lineup,
} from "$lib/presentation/logic/liveGameDetailState";

import { TEAM_SIDE } from "./gameEventConstants";
import { derive_live_game_correction_access } from "./liveGameCorrectionAccess";
import { resolve_live_game_max_players_on_field } from "./liveGameDetailMaxPlayersOnField";
import { derive_live_game_detail_clock_state } from "./liveGameDetailPageClockState";
import { derive_live_game_detail_presentation_state } from "./liveGameDetailPagePresentationState";
import type {
  LiveGameDetailDerivedState,
  LiveGameDetailEventState,
  LiveGameDetailPageState,
} from "./liveGameDetailPageState";
import {
  derive_optional_fixture_match_phase,
  LIVE_MATCH_PHASE,
} from "./liveGameMatchPhase";
import { derive_dismissed_player_ids } from "./liveGameOnFieldPlayers";
import { resolve_card_severity_rules } from "./liveGameSportCardRules";

const SUBSTITUTION_EVENT_ID = "substitution";

const EVENT_PLAYER_POOL = {
  SUBSTITUTE_COMING_ON: "substitute_coming_on",
  ON_FIELD: "on_field",
  WHOLE_SQUAD: "whole_squad",
} as const;

type EventPlayerPool =
  (typeof EVENT_PLAYER_POOL)[keyof typeof EVENT_PLAYER_POOL];

function resolve_event_player_pool(
  event_state: LiveGameDetailEventState,
): EventPlayerPool {
  if (event_state.selected_event_type?.id === SUBSTITUTION_EVENT_ID)
    return EVENT_PLAYER_POOL.SUBSTITUTE_COMING_ON;
  return event_state.selected_event_type?.affects_score
    ? EVENT_PLAYER_POOL.ON_FIELD
    : EVENT_PLAYER_POOL.WHOLE_SQUAD;
}

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

type PlayerOption = LiveGameDetailDerivedState["player_select_options"][number];

function exclude_unavailable_options(
  options: PlayerOption[],
  on_field_options: PlayerOption[],
  dismissed_player_ids: Set<string>,
): PlayerOption[] {
  const on_field_ids = new Set(on_field_options.map((option) => option.value));
  return options.filter(
    (option) =>
      !on_field_ids.has(option.value) &&
      !dismissed_player_ids.has(option.value),
  );
}

type EventPlayerOptions = Pick<
  LiveGameDetailDerivedState,
  "player_select_options" | "players_on_field_options" | "is_substitution_event"
>;

function select_event_player_options(
  pool: EventPlayerPool,
  team_player_options: PlayerOption[],
  players_on_field_options: PlayerOption[],
  dismissed_player_ids: Set<string>,
): PlayerOption[] {
  switch (pool) {
    case EVENT_PLAYER_POOL.SUBSTITUTE_COMING_ON:
      return exclude_unavailable_options(
        team_player_options,
        players_on_field_options,
        dismissed_player_ids,
      );
    case EVENT_PLAYER_POOL.ON_FIELD:
      return players_on_field_options;
    case EVENT_PLAYER_POOL.WHOLE_SQUAD:
      return team_player_options;
  }
}

function derive_event_player_options(
  page_state: LiveGameDetailPageState,
  event_state: LiveGameDetailEventState,
): EventPlayerOptions {
  const { home_players, away_players, fixture, sport, competition } =
    page_state;
  const team_side = event_state.selected_team_side;
  const card_rules = resolve_card_severity_rules(sport, competition);
  const pool = resolve_event_player_pool(event_state);
  const players_on_field_options = build_players_on_field_options(
    team_side,
    home_players,
    away_players,
    fixture?.game_events ?? [],
    card_rules,
  );
  const team_player_options = build_player_select_options_for_team(
    team_side,
    home_players,
    away_players,
  );
  const dismissed_player_ids = derive_dismissed_player_ids(
    team_side === TEAM_SIDE.HOME ? home_players : away_players,
    fixture?.game_events ?? [],
    team_side,
    card_rules,
  );
  return {
    player_select_options: select_event_player_options(
      pool,
      team_player_options,
      players_on_field_options,
      dismissed_player_ids,
    ),
    players_on_field_options,
    is_substitution_event: pool === EVENT_PLAYER_POOL.SUBSTITUTE_COMING_ON,
  };
}

function derive_live_game_detail_lineup_and_event_state(
  page_state: LiveGameDetailPageState,
  event_state: LiveGameDetailEventState,
): Omit<
  LiveGameDetailDerivedState,
  | keyof ReturnType<typeof derive_live_game_detail_clock_state>
  | keyof ReturnType<typeof derive_live_game_detail_presentation_state>
  | "correction_access"
> {
  const { home_players, away_players, fixture } = page_state;
  const match_phase = derive_optional_fixture_match_phase(fixture);
  return {
    home_starters: get_starters_from_lineup(home_players),
    home_substitutes: get_substitutes_from_lineup(home_players),
    away_starters: get_starters_from_lineup(away_players),
    away_substitutes: get_substitutes_from_lineup(away_players),
    home_score: fixture?.home_team_score ?? 0,
    away_score: fixture?.away_team_score ?? 0,
    sorted_events: sort_game_events(page_state),
    is_game_active: match_phase === LIVE_MATCH_PHASE.IN_PLAY,
    is_awaiting_full_time: match_phase === LIVE_MATCH_PHASE.AWAITING_FULL_TIME,
    is_game_completed: match_phase === LIVE_MATCH_PHASE.COMPLETED,
    all_event_buttons: build_sport_event_buttons(
      resolve_sport_event_source(page_state.sport, page_state.competition),
    ),
    ...derive_event_player_options(page_state, event_state),
    max_players_on_field: resolve_live_game_max_players_on_field(page_state),
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
    correction_access: derive_live_game_correction_access(
      command.page_state,
      command.page_state.fixture?.status === FIXTURE_STATUS.IN_PROGRESS,
    ),
  };
}

export function get_live_game_page_title(
  page_state: LiveGameDetailPageState,
): string {
  return page_state.fixture
    ? `${page_state.home_team?.name ?? "Home"} vs ${page_state.away_team?.name ?? "Away"}`
    : "Live Game Management";
}
