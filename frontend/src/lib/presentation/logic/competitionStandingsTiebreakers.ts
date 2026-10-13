import {
  DEFAULT_POINTS_CONFIG,
  type PointsConfig,
  type TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import { TIE_BREAKER } from "$lib/core/entities/CompetitionFormatTypes";
import type { Fixture } from "$lib/core/entities/Fixture";

import type { TeamStanding } from "./competitionStageResults";
import { compute_mini_league } from "./competitionStandingsMiniLeague";

type TiebreakerContext = {
  completed_fixtures: Fixture[];
  points_config: PointsConfig;
};

type ScoredStanding = { standing: TeamStanding; score: number[] };

const NEUTRAL_SCORE: number[] = [0];

function count_away_goals(
  team_id: string,
  completed_fixtures: Fixture[],
): number {
  return completed_fixtures
    .filter((fixture) => fixture.away_team_id === team_id)
    .reduce((sum, fixture) => sum + (fixture.away_team_score ?? 0), 0);
}

function score_group_by_head_to_head(
  group: TeamStanding[],
  context: TiebreakerContext,
): ScoredStanding[] {
  const records = compute_mini_league(
    group.map((standing) => standing.team_id),
    context.completed_fixtures,
    context.points_config,
  );
  return group.map((standing) => {
    const record = records.get(standing.team_id);
    return {
      standing,
      score: record
        ? [record.points, record.goal_difference, record.goals_for]
        : NEUTRAL_SCORE,
    };
  });
}

function score_standing(
  standing: TeamStanding,
  tiebreaker: TieBreaker,
  context: TiebreakerContext,
): number[] {
  switch (tiebreaker) {
    case TIE_BREAKER.GOAL_DIFFERENCE:
      return [standing.goal_difference];
    case TIE_BREAKER.GOALS_SCORED:
      return [standing.goals_for];
    case TIE_BREAKER.AWAY_GOALS:
      return [count_away_goals(standing.team_id, context.completed_fixtures)];
    case TIE_BREAKER.HEAD_TO_HEAD:
    case TIE_BREAKER.FAIR_PLAY:
    case TIE_BREAKER.DRAW:
    case TIE_BREAKER.PLAYOFF:
      return NEUTRAL_SCORE;
  }
}

function score_group(
  group: TeamStanding[],
  tiebreaker: TieBreaker,
  context: TiebreakerContext,
): ScoredStanding[] {
  return tiebreaker === TIE_BREAKER.HEAD_TO_HEAD
    ? score_group_by_head_to_head(group, context)
    : group.map((standing) => ({
        standing,
        score: score_standing(standing, tiebreaker, context),
      }));
}

function compare_scores_descending(left: number[], right: number[]): number {
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (right[index] ?? 0) - (left[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function split_into_equal_runs<Entry>(
  sorted_entries: Entry[],
  are_equal: (left: Entry, right: Entry) => boolean,
): Entry[][] {
  return sorted_entries.reduce((runs: Entry[][], entry: Entry) => {
    const last_run = runs[runs.length - 1];
    if (last_run && are_equal(last_run[0], entry)) {
      last_run.push(entry);
      return runs;
    }
    runs.push([entry]);
    return runs;
  }, []);
}

function resolve_tied_group(
  group: TeamStanding[],
  tie_breakers: TieBreaker[],
  context: TiebreakerContext,
): TeamStanding[] {
  if (group.length <= 1 || tie_breakers.length === 0) return group;
  const [current_tiebreaker, ...remaining_tiebreakers] = tie_breakers;
  const sorted = score_group(group, current_tiebreaker, context).sort(
    (left, right) => compare_scores_descending(left.score, right.score),
  );
  return split_into_equal_runs(
    sorted,
    (left, right) => compare_scores_descending(left.score, right.score) === 0,
  ).flatMap((run) =>
    resolve_tied_group(
      run.map((entry) => entry.standing),
      remaining_tiebreakers,
      context,
    ),
  );
}

export function apply_single_tiebreaker(
  left: TeamStanding,
  right: TeamStanding,
  completed_fixtures: Fixture[],
  tiebreaker: TieBreaker,
): number {
  const context = { completed_fixtures, points_config: DEFAULT_POINTS_CONFIG };
  const [left_scored, right_scored] = score_group(
    [left, right],
    tiebreaker,
    context,
  );
  return compare_scores_descending(left_scored.score, right_scored.score);
}

export function sort_standings_by_tiebreakers(
  standings: TeamStanding[],
  completed_fixtures: Fixture[],
  tie_breakers: TieBreaker[],
  points_config: PointsConfig = DEFAULT_POINTS_CONFIG,
): TeamStanding[] {
  const context = { completed_fixtures, points_config };
  const sorted_by_points = [...standings].sort(
    (left, right) => right.points - left.points,
  );
  return split_into_equal_runs(
    sorted_by_points,
    (left, right) => left.points === right.points,
  ).flatMap((group) => resolve_tied_group(group, tie_breakers, context));
}
