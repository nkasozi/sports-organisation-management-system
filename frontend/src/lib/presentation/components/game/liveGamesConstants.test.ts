import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";

import {
  build_live_game_detail_pending_start_state,
  build_live_games_body_state,
  LIVE_GAMES_BODY_STATUS,
  LIVE_GAMES_PENDING_START_STATUS,
  type LiveGamesBodyStateSource,
} from "./liveGamesConstants";

const READY_SOURCE: LiveGamesBodyStateSource = {
  is_loading: false,
  error_message: "",
  has_organizations: true,
  is_loading_fixtures: false,
  fixture_count: 2,
};

describe("build_live_games_body_state", () => {
  it("returns ready when everything is loaded", () => {
    expect(build_live_games_body_state(READY_SOURCE)).toEqual({
      status: LIVE_GAMES_BODY_STATUS.READY,
    });
  });

  it("orders states by priority", () => {
    expect(
      build_live_games_body_state({
        ...READY_SOURCE,
        is_loading: true,
        error_message: "x",
      }),
    ).toEqual({ status: LIVE_GAMES_BODY_STATUS.LOADING });
    expect(
      build_live_games_body_state({ ...READY_SOURCE, error_message: "Oops" }),
    ).toEqual({ status: LIVE_GAMES_BODY_STATUS.FAILED, message: "Oops" });
    expect(
      build_live_games_body_state({
        ...READY_SOURCE,
        has_organizations: false,
      }),
    ).toEqual({ status: LIVE_GAMES_BODY_STATUS.NO_ORGANIZATIONS });
    expect(
      build_live_games_body_state({
        ...READY_SOURCE,
        is_loading_fixtures: true,
      }),
    ).toEqual({ status: LIVE_GAMES_BODY_STATUS.LOADING_FIXTURES });
    expect(
      build_live_games_body_state({ ...READY_SOURCE, fixture_count: 0 }),
    ).toEqual({ status: LIVE_GAMES_BODY_STATUS.NO_FIXTURES });
  });
});

describe("build_live_game_detail_pending_start_state", () => {
  const fixture = { id: "fixture-1" } as Fixture;

  it("only confirms when the start modal is open and a fixture is loaded", () => {
    expect(build_live_game_detail_pending_start_state(true, fixture)).toEqual({
      status: LIVE_GAMES_PENDING_START_STATUS.CONFIRMING,
      fixture,
    });
    expect(build_live_game_detail_pending_start_state(false, fixture)).toEqual({
      status: LIVE_GAMES_PENDING_START_STATUS.IDLE,
    });
    expect(build_live_game_detail_pending_start_state(true, void 0)).toEqual({
      status: LIVE_GAMES_PENDING_START_STATUS.IDLE,
    });
  });
});
