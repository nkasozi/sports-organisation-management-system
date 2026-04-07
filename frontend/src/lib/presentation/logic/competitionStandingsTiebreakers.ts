import type { TieBreaker } from "$lib/core/entities/CompetitionFormat";
import type { Fixture } from "$lib/core/entities/Fixture";

import type { TeamStanding } from "./competitionStageResults";

function calculate_head_to_head(
  team_a_id: string,
  team_b_id: string,
  completed_fixtures: Fixture[],
): {
  team_a_points: number;
  team_b_points: number;
  team_a_gd: number;
  team_b_gd: number;
} {
  const h2h_fixtures = completed_fixtures.filter(
    (f) =>
      (f.home_team_id === team_a_id && f.away_team_id === team_b_id) ||
      (f.home_team_id === team_b_id && f.away_team_id === team_a_id),
  );

  let team_a_points = 0;
  let team_b_points = 0;
  let team_a_gd = 0;
  let team_b_gd = 0;

  for (const fixture of h2h_fixtures) {
    const home_goals = fixture.home_team_score ?? 0;
    const away_goals = fixture.away_team_score ?? 0;

    if (fixture.home_team_id === team_a_id) {
      team_a_gd += home_goals - away_goals;
      team_b_gd += away_goals - home_goals;
      if (home_goals > away_goals) team_a_points += 3;
      else if (home_goals === away_goals) {
        team_a_points += 1;
        team_b_points += 1;
      } else team_b_points += 3;
    } else {
      team_b_gd += home_goals - away_goals;
      team_a_gd += away_goals - home_goals;
      if (home_goals > away_goals) team_b_points += 3;
      else if (home_goals === away_goals) {
        team_a_points += 1;
        team_b_points += 1;
      } else team_a_points += 3;
    }
  }

  return { team_a_points, team_b_points, team_a_gd, team_b_gd };
}

export function apply_single_tiebreaker(
  left: TeamStanding,
  right: TeamStanding,
  completed_fixtures: Fixture[],
  tiebreaker: TieBreaker,
): number {
  switch (tiebreaker) {
    case "goal_difference":
      return right.goal_difference - left.goal_difference;
    case "goals_scored":
      return right.goals_for - left.goals_for;
    case "away_goals": {
      const left_away_goals = completed_fixtures
        .filter((f) => f.away_team_id === left.team_id)
        .reduce((sum, f) => sum + (f.away_team_score ?? 0), 0);
      const right_away_goals = completed_fixtures
        .filter((f) => f.away_team_id === right.team_id)
        .reduce((sum, f) => sum + (f.away_team_score ?? 0), 0);
      return right_away_goals - left_away_goals;
    }
    case "head_to_head": {
      const h2h = calculate_head_to_head(
        left.team_id,
        right.team_id,
        completed_fixtures,
      );
      if (h2h.team_b_points !== h2h.team_a_points)
        return h2h.team_b_points - h2h.team_a_points;
      return h2h.team_b_gd - h2h.team_a_gd;
    }
    default:
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
