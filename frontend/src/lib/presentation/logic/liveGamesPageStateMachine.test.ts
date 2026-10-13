import { describe, expect, it } from "vitest";

import {
  begin_live_games_fixture_refresh,
  create_initializing_live_games_view_state,
  LIVE_GAMES_VIEW_STATUS,
  settle_live_games_fixture_load,
} from "./liveGamesPageStateMachine";

const EMPTY_FIXTURE_STATE = {
  fixtures: [],
  team_names: {},
  team_logo_urls: {},
  competition_names: {},
  sport_names: {},
};

describe("liveGamesPageStateMachine", () => {
  it("starts initializing and keeps previous fixtures while refreshing", () => {
    expect(create_initializing_live_games_view_state().status).toBe(
      LIVE_GAMES_VIEW_STATUS.INITIALIZING,
    );
    expect(begin_live_games_fixture_refresh(EMPTY_FIXTURE_STATE)).toEqual({
      status: LIVE_GAMES_VIEW_STATUS.REFRESHING_FIXTURES,
      previous_fixture_state: EMPTY_FIXTURE_STATE,
    });
  });

  it("settles into ready or failed from a load result", () => {
    expect(
      settle_live_games_fixture_load({
        success: true,
        data: EMPTY_FIXTURE_STATE,
      }),
    ).toEqual({
      status: LIVE_GAMES_VIEW_STATUS.READY,
      fixture_state: EMPTY_FIXTURE_STATE,
    });
    expect(
      settle_live_games_fixture_load({
        success: false,
        error: "We couldn't load today's games.",
      }),
    ).toEqual({
      status: LIVE_GAMES_VIEW_STATUS.FAILED,
      error_message: "We couldn't load today's games.",
    });
  });
});
