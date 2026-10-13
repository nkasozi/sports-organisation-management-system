import { describe, expect, it } from "vitest";

import type {
  PointsConfig,
  TieBreaker,
} from "$lib/core/entities/CompetitionFormat";

import { calculate_team_standings } from "./competitionStageResults";
import {
  create_fixture,
  create_team,
} from "./competitionStageResults.test_support";

describe("competitionStageResults", () => {
  it("awards configured points_for_win instead of hardcoded 3", () => {
    const custom_points = {
      points_for_win: 2,
      points_for_draw: 1,
      points_for_loss: 0,
    } as PointsConfig;

    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 1,
          away_team_score: 0,
          status: "completed",
        }),
      ],
      [create_team("team-a", "Team A"), create_team("team-b", "Team B")],
      custom_points,
    );

    expect(standings[0].team_id).toBe("team-a");
    expect(standings[0].points).toBe(2);
    expect(standings[1].points).toBe(0);
  });

  it("awards configured points_for_draw instead of hardcoded 1", () => {
    const custom_points = {
      points_for_win: 3,
      points_for_draw: 0,
      points_for_loss: 0,
    } as PointsConfig;

    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 1,
          away_team_score: 1,
          status: "completed",
        }),
      ],
      [create_team("team-a", "Team A"), create_team("team-b", "Team B")],
      custom_points,
    );

    expect(standings[0].points).toBe(0);
    expect(standings[1].points).toBe(0);
  });

  it("uses head_to_head tie-breaker when points and goal_difference are equal", () => {
    const tie_breakers = [
      "goal_difference",
      "head_to_head",
      "goals_scored",
    ] as TieBreaker[];

    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
        create_fixture("team-b", "team-c", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
        create_fixture("team-a", "team-c", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
      ],
      [
        create_team("team-a", "Team A"),
        create_team("team-b", "Team B"),
        create_team("team-c", "Team C"),
      ],
      void 0,
      tie_breakers,
    );

    expect(standings[0].team_id).toBe("team-a");
    expect(standings[0].points).toBe(6);
    expect(standings[1].team_id).toBe("team-b");
    expect(standings[1].points).toBe(3);
    expect(standings[2].team_id).toBe("team-c");
  });

  it("uses goals_scored tie-breaker when points and goal_difference are equal between tied teams", () => {
    const tie_breakers = ["goal_difference", "goals_scored"] as TieBreaker[];

    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 3,
          away_team_score: 1,
          status: "completed",
        }),
        create_fixture("team-c", "team-d", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
      ],
      [
        create_team("team-a", "Team A"),
        create_team("team-b", "Team B"),
        create_team("team-c", "Team C"),
        create_team("team-d", "Team D"),
      ],
      void 0,
      tie_breakers,
    );

    expect(standings[0].team_id).toBe("team-a");
    expect(standings[0].goals_for).toBe(3);
    expect(standings[1].team_id).toBe("team-c");
    expect(standings[1].goals_for).toBe(2);
  });
});
