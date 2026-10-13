import { describe, expect, it } from "vitest";

import type {
  MatchReportPageData,
  MatchReportPageDataState,
} from "./matchReportPageLoadTypes";
import {
  apply_match_report_refresh_data,
  build_match_report_download_request,
} from "./matchReportPageTransitions";

const LOGO_URL = "https://example.com/logo.png";
const HOME_TEAM = { id: "team_home" } as never;
const AWAY_TEAM = { id: "team_away" } as never;

const PAGE_DATA: MatchReportPageData = {
  fixture: { id: "fixture_1", status: "in_progress" } as never,
  home_team_state: { status: "present", team: HOME_TEAM },
  away_team_state: { status: "present", team: AWAY_TEAM },
  competition_state: { status: "missing" },
  sport_state: { status: "missing" },
  venue_state: { status: "missing" },
  organization_name: "Org",
  assigned_officials_data: [],
  home_players: [{ id: "home_player" }] as never,
  away_players: [{ id: "away_player" }] as never,
};

const PRESENT_STATE: MatchReportPageDataState = {
  status: "present",
  page_data: PAGE_DATA,
};

const REFRESH_DATA = {
  fixture: { id: "fixture_1", status: "completed" } as never,
  home_players: [] as never,
  away_players: [{ id: "late_player" }] as never,
};

describe("apply_match_report_refresh_data", () => {
  it("keeps a missing state missing", () => {
    expect(
      apply_match_report_refresh_data({ status: "missing" }, REFRESH_DATA),
    ).toEqual({ status: "missing" });
  });

  it("replaces only the fixture and players of loaded page data", () => {
    expect(
      apply_match_report_refresh_data(PRESENT_STATE, REFRESH_DATA),
    ).toEqual({
      status: "present",
      page_data: { ...PAGE_DATA, ...REFRESH_DATA },
    });
  });
});

describe("build_match_report_download_request", () => {
  it("fails when page data is missing", () => {
    expect(
      build_match_report_download_request({ status: "missing" }, LOGO_URL)
        .success,
    ).toBe(false);
  });

  it.each(["home_team_state", "away_team_state"])(
    "fails when %s is missing",
    (team_state_key) => {
      const result = build_match_report_download_request(
        {
          status: "present",
          page_data: { ...PAGE_DATA, [team_state_key]: { status: "missing" } },
        },
        LOGO_URL,
      );
      expect(result.success).toBe(false);
    },
  );

  it("builds the download request from loaded page data", () => {
    expect(
      build_match_report_download_request(PRESENT_STATE, LOGO_URL),
    ).toEqual({
      success: true,
      data: {
        fixture: PAGE_DATA.fixture,
        home_team: HOME_TEAM,
        away_team: AWAY_TEAM,
        competition_state: PAGE_DATA.competition_state,
        sport_state: PAGE_DATA.sport_state,
        venue_state: PAGE_DATA.venue_state,
        assigned_officials_data: [],
        home_players: PAGE_DATA.home_players,
        away_players: PAGE_DATA.away_players,
        organization_logo_url: LOGO_URL,
      },
    });
  });
});
