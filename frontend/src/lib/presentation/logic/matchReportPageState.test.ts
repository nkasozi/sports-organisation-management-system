import { describe, expect, it } from "vitest";

import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

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

function create_game_event(
  overrides: Partial<ScalarInput<GameEvent>> = {},
): GameEvent {
  return {
    id: "event_1",
    event_type: "goal",
    minute: 10,
    stoppage_time_minute: null,
    team_side: "home",
    player_name: "Jordan Miles",
    secondary_player_name: "",
    description: "Goal",
    recorded_at: "2026-04-07T10:00:00Z",
    ...overrides,
  } as unknown as GameEvent;
}

function create_lineup_player(
  overrides: Partial<ScalarInput<LineupPlayer>> = {},
): LineupPlayer {
  return {
    id: "player_1",
    first_name: "Jordan",
    last_name: "Miles",
    jersey_number: 9,
    position: "Forward",
    is_captain: false,
    is_substitute: false,
    time_on: "present_at_start",
    ...overrides,
  } as unknown as LineupPlayer;
}

function create_fixture(overrides: Partial<ScalarInput<Fixture>> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "competition_1",
    round_number: 1,
    round_name: "Round 1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    venue: "venue_1",
    scheduled_date: "2026-04-07",
    scheduled_time: "15:00",
    home_team_score: 2,
    away_team_score: 1,
    assigned_officials: [],
    game_events: [],
    current_period: "first_half",
    current_minute: 12,
    match_day: 1,
    notes: "",
    stage_id: "stage_1",
    status: "in_progress",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

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
      home_players: [create_lineup_player({ id: "home_starter" })],
      away_players: [
        create_lineup_player({ id: "away_sub", is_substitute: true }),
      ],
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
      build_match_report_page_title(create_fixture(), "Lions", "Tigers"),
    ).toBe("Lions vs Tigers - Match Viewer");
    expect(build_match_report_page_title(null, null, null)).toBe(
      "Match Viewer",
    );
  });

  it("polls only while the match has not reached a terminal state", () => {
    expect(
      should_poll_match_report_fixture(create_fixture({ status: "scheduled" })),
    ).toBe(true);
    expect(
      should_poll_match_report_fixture(
        create_fixture({ status: "in_progress" }),
      ),
    ).toBe(true);
    expect(
      should_poll_match_report_fixture(create_fixture({ status: "completed" })),
    ).toBe(false);
    expect(should_poll_match_report_fixture(null)).toBe(false);
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
