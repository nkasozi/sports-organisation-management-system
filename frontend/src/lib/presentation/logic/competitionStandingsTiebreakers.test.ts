import { describe, expect, it } from "vitest";

import {
  apply_single_tiebreaker,
  sort_standings_by_tiebreakers,
} from "./competitionStandingsTiebreakers";

describe("competitionStandingsTiebreakers", () => {
  it("applies away-goal and head-to-head tie breakers", () => {
    expect(
      apply_single_tiebreaker(
        {
          team_id: "team-a",
          goal_difference: 0,
          goals_for: 0,
        } as never,
        {
          team_id: "team-b",
          goal_difference: 0,
          goals_for: 0,
        } as never,
        [
          {
            home_team_id: "team-c",
            away_team_id: "team-a",
            away_team_score: 2,
          },
          {
            home_team_id: "team-d",
            away_team_id: "team-b",
            away_team_score: 1,
          },
        ] as never,
        "away_goals",
      ),
    ).toBe(-1);

    expect(
      apply_single_tiebreaker(
        {
          team_id: "team-a",
          goal_difference: 0,
          goals_for: 0,
        } as never,
        {
          team_id: "team-b",
          goal_difference: 0,
          goals_for: 0,
        } as never,
        [
          {
            home_team_id: "team-a",
            away_team_id: "team-b",
            home_team_score: 1,
            away_team_score: 1,
          },
          {
            home_team_id: "team-b",
            away_team_id: "team-a",
            home_team_score: 2,
            away_team_score: 0,
          },
        ] as never,
        "head_to_head",
      ),
    ).toBe(3);
  });

  it("sorts standings by points before applying goal-difference tiebreakers", () => {
    expect(
      sort_standings_by_tiebreakers(
        [
          { team_id: "team-a", points: 6, goal_difference: 2, goals_for: 4 },
          { team_id: "team-b", points: 6, goal_difference: 5, goals_for: 3 },
          { team_id: "team-c", points: 4, goal_difference: 7, goals_for: 9 },
        ] as never,
        [] as never,
        ["goal_difference"],
      ).map((standing) => standing.team_id),
    ).toEqual(["team-b", "team-a", "team-c"]);
  });
});
