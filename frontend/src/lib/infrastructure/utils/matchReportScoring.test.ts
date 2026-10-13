import { describe, expect, it } from "vitest";

import type { GameEvent } from "$lib/core/entities/Fixture";
import { create_score_award_resolver } from "$lib/core/entities/SportEventCatalog";

import { calculate_score_by_period } from "./matchReportScoring";

const NETBALL_PERIODS = [
  { id: "q1", name: "1st Quarter", duration_minutes: 15, is_break: false },
  { id: "b1", name: "Quarter Break", duration_minutes: 3, is_break: true },
  { id: "q2", name: "2nd Quarter", duration_minutes: 15, is_break: false },
  { id: "ht", name: "Half Time", duration_minutes: 5, is_break: true },
  { id: "q3", name: "3rd Quarter", duration_minutes: 15, is_break: false },
  { id: "q4", name: "4th Quarter", duration_minutes: 15, is_break: false },
];

const FIRST_HALF = {
  id: "first_half",
  name: "First Half",
  duration_minutes: 45,
  is_break: false,
};
const SECOND_HALF = {
  id: "second_half",
  name: "Second Half",
  duration_minutes: 45,
  is_break: false,
};

const NETBALL_SCORING = create_score_award_resolver([
  { event_type: "goal", points_awarded: 1 },
  { event_type: "super_shot", points_awarded: 2 },
]);

function score_event(
  event_type: string,
  team_side: "home" | "away",
  minute: number,
): GameEvent {
  return { event_type, team_side, minute } as GameEvent;
}

describe("calculate_score_by_period", () => {
  it("shows the running score at the end of each quarter before the last", () => {
    const rows = calculate_score_by_period(
      [
        score_event("goal", "home", 4),
        score_event("super_shot", "away", 20),
        score_event("goal", "home", 40),
        score_event("goal", "home", 58),
      ],
      NETBALL_PERIODS,
      NETBALL_SCORING,
    );

    expect(rows).toEqual([
      { period_name: "3rd Quarter", home_score: 2, away_score: 2 },
      { period_name: "2nd Quarter", home_score: 1, away_score: 2 },
      { period_name: "1st Quarter", home_score: 1, away_score: 0 },
    ]);
  });

  it("adds the end of regulation when points come in extra time", () => {
    const rows = calculate_score_by_period(
      [score_event("goal", "home", 65)],
      NETBALL_PERIODS,
      NETBALL_SCORING,
    );

    expect(rows.slice(0, 2)).toEqual([
      { period_name: "Extra Time", home_score: 1, away_score: 0 },
      { period_name: "4th Quarter", home_score: 0, away_score: 0 },
    ]);
  });

  it("counts first-half stoppage time goals in the first half", () => {
    const rows = calculate_score_by_period(
      [
        { ...score_event("goal", "home", 45), stoppage_time_minute: 2 },
        score_event("goal", "away", 46),
      ] as GameEvent[],
      [FIRST_HALF, SECOND_HALF],
      create_score_award_resolver([]),
    );

    expect(rows).toEqual([
      { period_name: "First Half", home_score: 1, away_score: 0 },
    ]);
  });

  it("credits own goals to the other team", () => {
    const rows = calculate_score_by_period(
      [score_event("own_goal", "away", 10)],
      [FIRST_HALF, SECOND_HALF],
      create_score_award_resolver([]),
    );

    expect(rows).toEqual([
      { period_name: "First Half", home_score: 1, away_score: 0 },
    ]);
  });

  it("uses the points stored on each event instead of the current rules", () => {
    const rows = calculate_score_by_period(
      [
        { ...score_event("goal", "home", 4), points_awarded: 1 },
        { ...score_event("super_shot", "away", 20), points_awarded: 0 },
      ] as GameEvent[],
      NETBALL_PERIODS,
      NETBALL_SCORING,
    );

    expect(rows.at(-1)).toEqual({
      period_name: "1st Quarter",
      home_score: 1,
      away_score: 0,
    });
    expect(rows[0]).toEqual({
      period_name: "3rd Quarter",
      home_score: 1,
      away_score: 0,
    });
  });

  it("places events in their stored period even if the minute says otherwise", () => {
    const rows = calculate_score_by_period(
      [
        { ...score_event("goal", "home", 50), period_id: "first_half" },
        { ...score_event("goal", "away", 30), period_id: "second_half" },
      ] as GameEvent[],
      [FIRST_HALF, SECOND_HALF],
      create_score_award_resolver([]),
    );

    expect(rows).toEqual([
      { period_name: "First Half", home_score: 1, away_score: 0 },
    ]);
  });

  it("reports extra time for events stored in a period after regulation", () => {
    const rows = calculate_score_by_period(
      [
        { ...score_event("goal", "home", 80), period_id: "extra_time_first" },
      ] as GameEvent[],
      [FIRST_HALF, SECOND_HALF],
      create_score_award_resolver([]),
    );

    expect(rows).toEqual([
      { period_name: "Extra Time", home_score: 1, away_score: 0 },
      { period_name: "Second Half", home_score: 0, away_score: 0 },
      { period_name: "First Half", home_score: 0, away_score: 0 },
    ]);
  });
});
