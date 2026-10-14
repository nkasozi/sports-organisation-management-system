import { describe, expect, it } from "vitest";

import { resolve_event_score_award } from "./GameEventStoredFacts";
import { create_score_award_resolver } from "./SportEventCatalog";

const GOAL_SCORING = create_score_award_resolver([
  { event_type: "goal", points_awarded: 1 },
]);

describe("resolve_event_score_award for shootout kicks", () => {
  it("never counts a penalty shootout kick as a match score", () => {
    expect(
      resolve_event_score_award(
        {
          event_type: "goal",
          team_side: "home",
          period_id: "penalty_shootout",
          points_awarded: 1,
        } as never,
        GOAL_SCORING,
      ),
    ).toEqual({ kind: "none" });
  });

  it("still counts a regular goal", () => {
    expect(
      resolve_event_score_award(
        {
          event_type: "goal",
          team_side: "home",
          period_id: "first_half",
        } as never,
        GOAL_SCORING,
      ).kind,
    ).toBe("credit");
  });
});
