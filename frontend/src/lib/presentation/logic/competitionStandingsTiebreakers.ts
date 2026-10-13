import type { TieBreaker } from "$lib/core/entities/CompetitionFormat";
import { TIE_BREAKER } from "$lib/core/entities/CompetitionFormatTypes";
import type { Fixture } from "$lib/core/entities/Fixture";

import type { TeamStanding } from "./competitionStageResults";

interface HeadToHeadSummary {
  team_a_points: number;
  team_b_points: number;
  team_a_gd: number;
  team_b_gd: number;
}

function apply_head_to_head_fixture(
  summary: HeadToHeadSummary,
  team_a_goals: number,
  team_b_goals: number,
): HeadToHeadSummary {
  const team_a_result_points =
    team_a_goals > team_b_goals ? 3 : team_a_goals === team_b_goals ? 1 : 0;
  const team_b_result_points =
    team_b_goals > team_a_goals ? 3 : team_a_goals === team_b_goals ? 1 : 0;
  return {
    team_a_points: summary.team_a_points + team_a_result_points,
    team_b_points: summary.team_b_points + team_b_result_points,
    team_a_gd: summary.team_a_gd + (team_a_goals - team_b_goals),
    team_b_gd: summary.team_b_gd + (team_b_goals - team_a_goals),
  };
}

function calculate_head_to_head(
  team_a_id: string,
  team_b_id: string,
  completed_fixtures: Fixture[],
): HeadToHeadSummary {
  const h2h_fixtures = completed_fixtures.filter(
    (f) =>
      (f.home_team_id === team_a_id && f.away_team_id === team_b_id) ||
      (f.home_team_id === team_b_id && f.away_team_id === team_a_id),
  );

  return h2h_fixtures.reduce(
    (summary: HeadToHeadSummary, fixture: Fixture): HeadToHeadSummary => {
      const home_goals = fixture.home_team_score ?? 0;
      const away_goals = fixture.away_team_score ?? 0;
      const is_team_a_home = fixture.home_team_id === team_a_id;
      return apply_head_to_head_fixture(
        summary,
        is_team_a_home ? home_goals : away_goals,
        is_team_a_home ? away_goals : home_goals,
      );
    },
    { team_a_points: 0, team_b_points: 0, team_a_gd: 0, team_b_gd: 0 },
  );
}

export function apply_single_tiebreaker(
  left: TeamStanding,
  right: TeamStanding,
  completed_fixtures: Fixture[],
  tiebreaker: TieBreaker,
): number {
  switch (tiebreaker) {
    case TIE_BREAKER.GOAL_DIFFERENCE:
      return right.goal_difference - left.goal_difference;
    case TIE_BREAKER.GOALS_SCORED:
      return right.goals_for - left.goals_for;
    case TIE_BREAKER.AWAY_GOALS: {
      const left_away_goals = completed_fixtures
        .filter((f) => f.away_team_id === left.team_id)
        .reduce((sum, f) => sum + (f.away_team_score ?? 0), 0);
      const right_away_goals = completed_fixtures
        .filter((f) => f.away_team_id === right.team_id)
        .reduce((sum, f) => sum + (f.away_team_score ?? 0), 0);
      return right_away_goals - left_away_goals;
    }
    case TIE_BREAKER.HEAD_TO_HEAD: {
      const h2h = calculate_head_to_head(
        left.team_id,
        right.team_id,
        completed_fixtures,
      );
      if (h2h.team_b_points !== h2h.team_a_points)
        return h2h.team_b_points - h2h.team_a_points;
      return h2h.team_b_gd - h2h.team_a_gd;
    }
    case TIE_BREAKER.FAIR_PLAY:
    case TIE_BREAKER.DRAW:
    case TIE_BREAKER.PLAYOFF:
      return 0;
  }
}

export function sort_standings_by_tiebreakers(
  standings: TeamStanding[],
  completed_fixtures: Fixture[],
  tie_breakers: TieBreaker[],
): TeamStanding[] {
  return [...standings].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    for (const tiebreaker of tie_breakers) {
      const result = apply_single_tiebreaker(
        left,
        right,
        completed_fixtures,
        tiebreaker,
      );
      if (result !== 0) return result;
    }
    return 0;
  });
}
