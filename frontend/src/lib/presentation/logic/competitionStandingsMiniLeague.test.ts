import { describe, expect, it } from "vitest";

import { sort_standings_by_tiebreakers } from "./competitionStandingsTiebreakers";

function fixture(
  home: string,
  away: string,
  home_score: number,
  away_score: number,
): never {
  return {
    home_team_id: home,
    away_team_id: away,
    home_team_score: home_score,
    away_team_score: away_score,
    status: "completed",
  } as never;
}

function standing(team_id: string, goals_for = 0): never {
  return { team_id, points: 9, goal_difference: 0, goals_for } as never;
}

describe("head-to-head mini-league among tied teams", () => {
  it("falls through to the next tiebreaker when three tied teams beat each other in a cycle", () => {
    const order = sort_standings_by_tiebreakers(
      [standing("a", 5), standing("b", 7), standing("c", 6)],
      [
        fixture("a", "b", 1, 0),
        fixture("b", "c", 1, 0),
        fixture("c", "a", 1, 0),
      ],
      ["head_to_head", "goals_scored"],
    ).map((entry) => entry.team_id);
    expect(order).toEqual(["b", "c", "a"]);
  });

  it("ranks the tied teams by the competition's own points for results", () => {
    const fixtures = [
      fixture("a", "b", 1, 0),
      fixture("c", "a", 3, 0),
      fixture("b", "c", 0, 0),
    ];
    const tied = [standing("a"), standing("b"), standing("c")];
    expect(
      sort_standings_by_tiebreakers(tied, fixtures, ["head_to_head"]).map(
        (entry) => entry.team_id,
      ),
    ).toEqual(["c", "a", "b"]);
    expect(
      sort_standings_by_tiebreakers(tied, fixtures, ["head_to_head"], {
        points_for_win: 1,
        points_for_draw: 1,
        points_for_loss: 0,
      }).map((entry) => entry.team_id),
    ).toEqual(["c", "b", "a"]);
  });

  it("ignores matches against teams outside the tied group", () => {
    const order = sort_standings_by_tiebreakers(
      [
        standing("a"),
        standing("b"),
        { ...(standing("z") as object), points: 3 } as never,
      ],
      [fixture("a", "z", 5, 0), fixture("b", "a", 1, 0)],
      ["head_to_head"],
    ).map((entry) => entry.team_id);
    expect(order).toEqual(["b", "a", "z"]);
  });
});
