import { describe, expect, it } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import type { Team } from "$lib/core/entities/Team";
import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  build_live_game_detail_content_state,
  get_lineup_team_fallback_name,
  get_team_option_name,
  LIVE_GAME_DETAIL_CONTENT_STATUS,
  type LiveGameDetailContentSource,
} from "./liveGameDetailContentState";
import { LIVE_GAME_DETAIL_TEXT } from "./liveGameDetailMessages";

const fixture = {
  id: "fixture-1",
  status: FIXTURE_STATUS.SCHEDULED,
} as Fixture;
const team = { id: "team-1", name: "Lions" } as Team;

function build_source(
  overrides: Partial<LiveGameDetailContentSource>,
): LiveGameDetailContentSource {
  return { is_loading: false, error_message: "", ...overrides };
}

describe("build_live_game_detail_content_state", () => {
  it("prioritises loading", () => {
    expect(
      build_live_game_detail_content_state(
        build_source({ is_loading: true, error_message: "x", fixture }),
      ),
    ).toEqual({ status: LIVE_GAME_DETAIL_CONTENT_STATUS.LOADING });
  });

  it("reports failures", () => {
    expect(
      build_live_game_detail_content_state(
        build_source({ error_message: "Denied" }),
      ),
    ).toEqual({
      status: LIVE_GAME_DETAIL_CONTENT_STATUS.FAILED,
      message: "Denied",
    });
  });

  it("is empty without a fixture", () => {
    expect(build_live_game_detail_content_state(build_source({}))).toEqual({
      status: LIVE_GAME_DETAIL_CONTENT_STATUS.EMPTY,
    });
  });

  it("models missing teams explicitly", () => {
    expect(
      build_live_game_detail_content_state(
        build_source({ fixture, home_team: team }),
      ),
    ).toEqual({
      status: LIVE_GAME_DETAIL_CONTENT_STATUS.READY,
      fixture,
      home_team: create_some_option(team),
      away_team: create_none_option(),
      competition_name: "",
    });
  });
});

describe("team display helpers", () => {
  it("uses the team name or the fallback", () => {
    expect(get_team_option_name(create_some_option(team), "Home")).toBe(
      "Lions",
    );
    expect(get_team_option_name(create_none_option(), "Home")).toBe("Home");
  });

  it("uses longer fallbacks before kick-off", () => {
    expect(get_lineup_team_fallback_name(FIXTURE_STATUS.SCHEDULED, true)).toBe(
      LIVE_GAME_DETAIL_TEXT.HOME_TEAM_FALLBACK,
    );
    expect(
      get_lineup_team_fallback_name(FIXTURE_STATUS.IN_PROGRESS, false),
    ).toBe(LIVE_GAME_DETAIL_TEXT.AWAY_FALLBACK);
  });
});
