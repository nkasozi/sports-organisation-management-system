import type { LiveGamesFixtureState } from "$lib/presentation/logic/liveGamesDataLoader";
import {
  create_initializing_live_games_view_state,
  LIVE_GAMES_VIEW_STATUS,
} from "$lib/presentation/logic/liveGamesPageStateMachine";

export type LiveGamesViewState = ReturnType<
  typeof create_initializing_live_games_view_state
>;

export const LIVE_GAMES_ROUTE_PATHS = {
  LIVE_GAMES: "/live-games",
  HOME: "/",
} as const;

interface LiveGamesRouteView {
  is_loading: boolean;
  is_loading_fixtures: boolean;
  error_message: string;
  fixture_state: LiveGamesFixtureState;
}

export function create_empty_live_games_fixture_state(): LiveGamesFixtureState {
  return {
    fixtures: [],
    team_names: {},
    team_logo_urls: {},
    competition_names: {},
    sport_names: {},
  };
}

function build_view(
  partial: Partial<LiveGamesRouteView>,
  action_error_message: string,
): LiveGamesRouteView {
  return {
    is_loading: false,
    is_loading_fixtures: false,
    error_message: action_error_message,
    fixture_state: create_empty_live_games_fixture_state(),
    ...partial,
  };
}

export function derive_live_games_route_view(
  view_state: LiveGamesViewState,
  action_error_message: string,
): LiveGamesRouteView {
  switch (view_state.status) {
    case LIVE_GAMES_VIEW_STATUS.INITIALIZING:
      return build_view({ is_loading: true }, action_error_message);
    case LIVE_GAMES_VIEW_STATUS.REFRESHING_FIXTURES:
      return build_view(
        {
          is_loading_fixtures: true,
          fixture_state: view_state.previous_fixture_state,
        },
        action_error_message,
      );
    case LIVE_GAMES_VIEW_STATUS.READY:
      return build_view(
        { fixture_state: view_state.fixture_state },
        action_error_message,
      );
    case LIVE_GAMES_VIEW_STATUS.FAILED:
      return build_view({ error_message: view_state.error_message }, "");
  }
}

export function current_live_games_fixture_state(
  view_state: LiveGamesViewState,
): LiveGamesFixtureState {
  return derive_live_games_route_view(view_state, "").fixture_state;
}
