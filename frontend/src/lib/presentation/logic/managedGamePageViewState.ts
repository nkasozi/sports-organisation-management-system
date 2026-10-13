import {
  type Fixture,
  type GamePeriod,
  get_period_display_name,
} from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import {
  build_game_clock_state,
  sort_game_events,
} from "$lib/presentation/logic/gameManageState";

import { TEAM_SIDE } from "./gameEventConstants";
import type { ManagedGamePageState } from "./managedGamePageControllerState";
import { PRESENCE_STATUS } from "./presenceStatus";

interface ManagedGamePageViewState {
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

type ManagedGameFixtureViewFields = {
  current_period: GamePeriod;
  away_score: number;
  home_score: number;
  is_game_active: boolean;
  sorted_events: Fixture["game_events"];
};

const DEFAULT_CURRENT_PERIOD: GamePeriod = "first_half";
const DEFAULT_HOME_TEAM_NAME = "Home";
const DEFAULT_AWAY_TEAM_NAME = "Away";
const DEFAULT_PAGE_TITLE = "Game Management";

function derive_fixture_view_fields(
  state: ManagedGamePageState,
): ManagedGameFixtureViewFields {
  if (state.fixture.status !== PRESENCE_STATUS.PRESENT)
    return {
      current_period: DEFAULT_CURRENT_PERIOD,
      away_score: 0,
      home_score: 0,
      is_game_active: false,
      sorted_events: sort_game_events([]),
    };
  const fixture = state.fixture.fixture;
  return {
    current_period: fixture.current_period,
    away_score: fixture.away_team_score,
    home_score: fixture.home_team_score,
    is_game_active: fixture.status === FIXTURE_STATUS.IN_PROGRESS,
    sorted_events: sort_game_events(fixture.game_events),
  };
}

function get_home_team_name(state: ManagedGamePageState): string {
  return state.home_team.status === PRESENCE_STATUS.PRESENT
    ? state.home_team.team.name
    : DEFAULT_HOME_TEAM_NAME;
}

function get_away_team_name(state: ManagedGamePageState): string {
  return state.away_team.status === PRESENCE_STATUS.PRESENT
    ? state.away_team.team.name
    : DEFAULT_AWAY_TEAM_NAME;
}

export function derive_managed_game_view_state(
  state: ManagedGamePageState,
): ManagedGamePageViewState {
  const fixture_fields = derive_fixture_view_fields(state);
  return {
    available_players:
      state.selected_team_side === TEAM_SIDE.HOME
        ? state.home_players
        : state.away_players,
    away_score: fixture_fields.away_score,
    away_team_name: get_away_team_name(state),
    clock_state: build_game_clock_state(
      state.game_clock_seconds,
      fixture_fields.current_period,
    ),
    current_period_label: get_period_display_name(
      fixture_fields.current_period,
    ),
    home_score: fixture_fields.home_score,
    home_team_name: get_home_team_name(state),
    is_game_active: fixture_fields.is_game_active,
    sorted_events: fixture_fields.sorted_events,
  };
}

export function build_managed_game_page_title(
  state: ManagedGamePageState,
): string {
  if (state.fixture.status !== PRESENCE_STATUS.PRESENT) {
    return DEFAULT_PAGE_TITLE;
  }

  return `${get_home_team_name(state)} vs ${get_away_team_name(state)}`;
}
