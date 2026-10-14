import { describe, expect, it } from "vitest";

import type { GameEvent } from "$lib/core/entities/Fixture";
import { create_score_award_resolver } from "$lib/core/entities/SportEventCatalog";

import { calculate_score_by_period } from "./matchReportScoring";

const HALVES_WITH_BREAK = [
  {
    id: "first_half",
    name: "First Half",
    duration_minutes: 45,
    is_break: false,
  },
  { id: "half_time", name: "Half Time", duration_minutes: 15, is_break: true },
  {
    id: "second_half",
    name: "Second Half",
    duration_minutes: 45,
    is_break: false,
  },
];

const GOAL_SCORING = create_score_award_resolver([
  { event_type: "goal", points_awarded: 1 },
]);

function event(
  team_side: GameEvent["team_side"],
  minute: number,
  period_id: string,
): GameEvent {
  return {
    event_type: "goal",
    team_side,
    minute,
    period_id,
    points_awarded: 1,
  } as unknown as GameEvent;
}

describe("calculate_score_by_period attribution", () => {
  it("credits an event stored during a break to the period that just ended", () => {
    const rows = calculate_score_by_period(
      [event("home", 45, "half_time")],
      HALVES_WITH_BREAK,
      GOAL_SCORING,
    );
    expect(rows).toEqual([
      { period_name: "First Half", home_score: 1, away_score: 0 },
    ]);
  });

  it("never credits match-side events to either team", () => {
    const rows = calculate_score_by_period(
      [event("match", 10, "first_half"), event("away", 20, "first_half")],
      HALVES_WITH_BREAK,
      GOAL_SCORING,
    );
    expect(rows).toEqual([
      { period_name: "First Half", home_score: 0, away_score: 1 },
    ]);
  });
});
