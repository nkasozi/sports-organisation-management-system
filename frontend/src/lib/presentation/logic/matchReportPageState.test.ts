import { describe, expect, it } from "vitest";

import {
  build_match_report_lineup_groups,
  build_match_report_page_title,
  build_match_report_view_state,
  format_match_report_kickoff_display,
  get_match_report_event_bg_class,
  get_match_report_status_color,
  get_match_report_status_label,
  should_poll_match_report_fixture,
} from "./matchReportPageState";
import {
  create_fixture,
  create_game_event,
  create_lineup_player,
  create_match_report_page_data_state,
} from "./matchReportPageState.test_support";

describe("matchReportPageState", () => {
  it("splits lineup players into starters and substitutes", () => {
    const result = build_match_report_lineup_groups([
      create_lineup_player({ id: "starter_1", is_substitute: false }),
      create_lineup_player({ id: "sub_1", is_substitute: true }),
    ]);

    expect(result.starters.map((player) => player.id)).toEqual(["starter_1"]);
    expect(result.substitutes.map((player) => player.id)).toEqual(["sub_1"]);
  });

  it("builds derived match report view state from the fixture and lineups", () => {
    const result = build_match_report_view_state({
      page_data_state: create_match_report_page_data_state({
        page_data: {
          fixture: create_fixture({
            game_events: [
              create_game_event({
                id: "late_event",
                minute: 30,
                recorded_at: "2026-04-07T10:30:00Z",
              }),
              create_game_event({
                id: "early_event",
                minute: 10,
                recorded_at: "2026-04-07T10:10:00Z",
              }),
            ],
          }),
          home_team_state: {
            status: "present",
            team: { id: "team_1", name: "Lions" } as never,
          },
          away_team_state: {
            status: "present",
            team: { id: "team_2", name: "Tigers" } as never,
          },
          competition_state: { status: "missing" },
          sport_state: { status: "missing" },
          venue_state: { status: "missing" },
          organization_name: "",
          assigned_officials_data: [],
          home_players: [create_lineup_player({ id: "home_starter" })],
          away_players: [
            create_lineup_player({ id: "away_sub", is_substitute: true }),
          ],
        },
      }),
    });

    expect(result.home_score).toBe(2);
    expect(result.away_score).toBe(1);
    expect(result.sorted_events.map((event) => event.id)).toEqual([
      "early_event",
      "late_event",
    ]);
    expect(result.home_starters.map((player) => player.id)).toEqual([
      "home_starter",
    ]);
    expect(result.away_substitutes.map((player) => player.id)).toEqual([
      "away_sub",
    ]);
    expect(result.is_game_in_progress).toBe(true);
    expect(result.is_game_completed).toBe(false);
    expect(result.has_lineups).toBe(true);
  });

  it("formats kickoff display with a readable date and time", () => {
    const result = format_match_report_kickoff_display("2026-04-07", "15:00");

    expect(result).toContain("2026");
    expect(result).toContain("15:00");
  });

  it("builds a stable page title from the loaded teams", () => {
    expect(
      build_match_report_page_title(create_match_report_page_data_state()),
    ).toBe("Lions vs Tigers - Match Viewer");
    expect(build_match_report_page_title({ status: "missing" })).toBe(
      "Match Viewer",
    );
  });

  it("polls only while the match has not reached a terminal state", () => {
    expect(
      should_poll_match_report_fixture(
        create_match_report_page_data_state({
          page_data: {
            fixture: create_fixture({ status: "scheduled" }),
            home_team_state: { status: "missing" },
            away_team_state: { status: "missing" },
            competition_state: { status: "missing" },
            sport_state: { status: "missing" },
            venue_state: { status: "missing" },
            organization_name: "",
            assigned_officials_data: [],
            home_players: [],
            away_players: [],
          },
        }),
      ),
    ).toBe(true);
    expect(
      should_poll_match_report_fixture(
        create_match_report_page_data_state({
          page_data: {
            fixture: create_fixture({ status: "in_progress" }),
            home_team_state: { status: "missing" },
            away_team_state: { status: "missing" },
            competition_state: { status: "missing" },
            sport_state: { status: "missing" },
            venue_state: { status: "missing" },
            organization_name: "",
            assigned_officials_data: [],
            home_players: [],
            away_players: [],
          },
        }),
      ),
    ).toBe(true);
    expect(
      should_poll_match_report_fixture(
        create_match_report_page_data_state({
          page_data: {
            fixture: create_fixture({ status: "completed" }),
            home_team_state: { status: "missing" },
            away_team_state: { status: "missing" },
            competition_state: { status: "missing" },
            sport_state: { status: "missing" },
            venue_state: { status: "missing" },
            organization_name: "",
            assigned_officials_data: [],
            home_players: [],
            away_players: [],
          },
        }),
      ),
    ).toBe(false);
    expect(should_poll_match_report_fixture({ status: "missing" })).toBe(false);
  });

  it("returns the expected timeline and status classes", () => {
    expect(get_match_report_event_bg_class(create_game_event())).toContain(
      "green",
    );
    expect(
      get_match_report_event_bg_class(
        create_game_event({ event_type: "red_card" }),
      ),
    ).toContain("red");
    expect(get_match_report_status_color("in_progress")).toBe("text-green-400");
    expect(get_match_report_status_label("completed")).toBe("Full Time");
    expect(get_match_report_status_label("scheduled")).toBe("Upcoming");
  });
});
