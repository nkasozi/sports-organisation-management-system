import type { Fixture } from "$lib/core/entities/Fixture";
import type { LiveGamesPendingStartFixtureState } from "$lib/presentation/logic/liveGamesPageState";

export const LIVE_GAMES_PENDING_START_STATUS = {
  IDLE: "idle",
  CONFIRMING: "confirming",
} as const satisfies Record<
  string,
  LiveGamesPendingStartFixtureState["status"]
>;

export const LIVE_GAMES_PREFLIGHT_TEXT = {
  TITLE: "Pre-flight Checks",
} as const;

export const LIVE_GAMES_BODY_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  NO_ORGANIZATIONS: "no_organizations",
  LOADING_FIXTURES: "loading_fixtures",
  NO_FIXTURES: "no_fixtures",
  READY: "ready",
} as const;

export type LiveGamesBodyState =
  | { status: typeof LIVE_GAMES_BODY_STATUS.LOADING }
  | { status: typeof LIVE_GAMES_BODY_STATUS.FAILED; message: string }
  | { status: typeof LIVE_GAMES_BODY_STATUS.NO_ORGANIZATIONS }
  | { status: typeof LIVE_GAMES_BODY_STATUS.LOADING_FIXTURES }
  | { status: typeof LIVE_GAMES_BODY_STATUS.NO_FIXTURES }
  | { status: typeof LIVE_GAMES_BODY_STATUS.READY };

export interface LiveGamesBodyStateSource {
  is_loading: boolean;
  error_message: string;
  has_organizations: boolean;
  is_loading_fixtures: boolean;
  fixture_count: number;
}

export function build_live_games_body_state(
  source: LiveGamesBodyStateSource,
): LiveGamesBodyState {
  if (source.is_loading) return { status: LIVE_GAMES_BODY_STATUS.LOADING };
  if (source.error_message) {
    return {
      status: LIVE_GAMES_BODY_STATUS.FAILED,
      message: source.error_message,
    };
  }
  if (!source.has_organizations) {
    return { status: LIVE_GAMES_BODY_STATUS.NO_ORGANIZATIONS };
  }
  if (source.is_loading_fixtures) {
    return { status: LIVE_GAMES_BODY_STATUS.LOADING_FIXTURES };
  }
  if (source.fixture_count === 0) {
    return { status: LIVE_GAMES_BODY_STATUS.NO_FIXTURES };
  }
  return { status: LIVE_GAMES_BODY_STATUS.READY };
}

export const LIVE_GAMES_BODY_TEXT = {
  UNKNOWN_TEAM: "Unknown Team",
  UNKNOWN_COMPETITION: "Unknown Competition",
  UNKNOWN_SPORT: "Unknown Sport",
  NO_ORGANIZATIONS: "No organizations found",
  ORGANIZATIONS_PATH: "/organizations",
  GO_TO_ORGANIZATIONS: "Go to Organizations",
  NO_FIXTURES: "No upcoming fixtures to start",
  FIXTURES_PATH: "/fixtures",
  CREATE_FIXTURE: "Create Fixture",
} as const;

export function build_live_game_detail_pending_start_state(
  is_start_modal_open: boolean,
  fixture: Fixture | undefined,
): LiveGamesPendingStartFixtureState {
  if (!is_start_modal_open || !fixture) {
    return { status: LIVE_GAMES_PENDING_START_STATUS.IDLE };
  }
  return { status: LIVE_GAMES_PENDING_START_STATUS.CONFIRMING, fixture };
}
