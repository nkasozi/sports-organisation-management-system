import type { Result } from "$lib/core/types/Result";

import type { LiveGamesFixtureState } from "./liveGamesDataTypes";

export const LIVE_GAMES_VIEW_STATUS = {
  INITIALIZING: "initializing",
  REFRESHING_FIXTURES: "refreshing_fixtures",
  READY: "ready",
  FAILED: "failed",
} as const;

type LiveGamesViewState =
  | { status: typeof LIVE_GAMES_VIEW_STATUS.INITIALIZING }
  | {
      status: typeof LIVE_GAMES_VIEW_STATUS.REFRESHING_FIXTURES;
      previous_fixture_state: LiveGamesFixtureState;
    }
  | {
      status: typeof LIVE_GAMES_VIEW_STATUS.READY;
      fixture_state: LiveGamesFixtureState;
    }
  | { status: typeof LIVE_GAMES_VIEW_STATUS.FAILED; error_message: string };

export function create_initializing_live_games_view_state(): LiveGamesViewState {
  return { status: LIVE_GAMES_VIEW_STATUS.INITIALIZING };
}

export function begin_live_games_fixture_refresh(
  fixture_state: LiveGamesFixtureState,
): LiveGamesViewState {
  return {
    status: LIVE_GAMES_VIEW_STATUS.REFRESHING_FIXTURES,
    previous_fixture_state: fixture_state,
  };
}

export function settle_live_games_fixture_load(
  result: Result<LiveGamesFixtureState>,
): LiveGamesViewState {
  return result.success
    ? { status: LIVE_GAMES_VIEW_STATUS.READY, fixture_state: result.data }
    : { status: LIVE_GAMES_VIEW_STATUS.FAILED, error_message: result.error };
}
