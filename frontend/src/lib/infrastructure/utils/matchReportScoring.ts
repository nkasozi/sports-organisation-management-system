import type { GameEvent } from "$lib/core/entities/Fixture";
import {
  read_event_period_id,
  resolve_event_score_award,
} from "$lib/core/entities/GameEventStoredFacts";
import {
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
  type ScoreAward,
  type ScoreAwardResolver,
} from "$lib/core/entities/SportEventCatalog";
import type { MatchScoreByPeriod } from "$lib/core/types/MatchReportTypes";
import { OptionStatus } from "$lib/core/types/Option";

import {
  EXTRA_TIME_PERIOD_NAME,
  SCORING_TEAM_SIDE,
} from "./matchReportScoringConstants";

export interface ReportScoringPeriod {
  id: string;
  name: string;
  duration_minutes: number;
  is_break: boolean;
}

type RunningScore = { home: number; away: number };

type PeriodBoundary = { id: string; name: string; end_minute: number };

type PeriodRanking = {
  boundaries: readonly PeriodBoundary[];
  break_ranks: ReadonlyMap<string, number>;
};

const BEFORE_FIRST_PERIOD_RANK = 0;

type RankedScore = { rank: number; event: GameEvent; award: ScoreAward };

function build_playing_boundaries(
  periods: readonly ReportScoringPeriod[],
): PeriodBoundary[] {
  let elapsed_minutes = 0;
  return periods
    .filter((period) => !period.is_break)
    .map((period) => {
      elapsed_minutes += period.duration_minutes;
      return { id: period.id, name: period.name, end_minute: elapsed_minutes };
    });
}

function build_break_ranks(
  periods: readonly ReportScoringPeriod[],
): ReadonlyMap<string, number> {
  const break_ranks = new Map<string, number>();
  let playing_period_count = 0;
  for (const period of periods) {
    if (!period.is_break) {
      playing_period_count += 1;
      continue;
    }
    break_ranks.set(
      period.id,
      Math.max(BEFORE_FIRST_PERIOD_RANK, playing_period_count - 1),
    );
  }
  return break_ranks;
}

function rank_by_minute(
  event: GameEvent,
  boundaries: readonly PeriodBoundary[],
): number {
  const index = boundaries.findIndex(
    (boundary) => event.minute <= boundary.end_minute,
  );
  return index === -1 ? boundaries.length : index;
}

function rank_by_stored_period(
  period_id: string,
  ranking: PeriodRanking,
): number {
  const break_rank = ranking.break_ranks.get(period_id);
  if (break_rank !== void 0) return break_rank;
  const index = ranking.boundaries.findIndex(
    (boundary) => boundary.id === period_id,
  );
  return index === -1 ? ranking.boundaries.length : index;
}

function rank_event(event: GameEvent, ranking: PeriodRanking): number {
  const stored_period = read_event_period_id(event);
  switch (stored_period.status) {
    case OptionStatus.SOME:
      return rank_by_stored_period(stored_period.value, ranking);
    case OptionStatus.NONE:
      return rank_by_minute(event, ranking.boundaries);
  }
}

function rank_scores(
  game_events: readonly GameEvent[],
  ranking: PeriodRanking,
  resolve_score: ScoreAwardResolver,
): RankedScore[] {
  return game_events
    .map((event) => ({
      rank: rank_event(event, ranking),
      event,
      award: resolve_event_score_award(event, resolve_score),
    }))
    .filter(
      (ranked) =>
        ranked.award.kind === SCORE_AWARD_KIND.CREDIT &&
        ranked.event.team_side !== SCORING_TEAM_SIDE.MATCH,
    );
}

function credit_points(
  score: RunningScore,
  event: GameEvent,
  award: ScoreAward,
): RunningScore {
  switch (award.kind) {
    case SCORE_AWARD_KIND.NONE:
      return score;
    case SCORE_AWARD_KIND.CREDIT: {
      const is_home_side = event.team_side === SCORING_TEAM_SIDE.HOME;
      const is_home_credited =
        award.credited_side === SCORE_CREDITED_SIDE.ACTING
          ? is_home_side
          : event.team_side === SCORING_TEAM_SIDE.AWAY;
      return is_home_credited
        ? { ...score, home: score.home + award.points }
        : { ...score, away: score.away + award.points };
    }
  }
}

function score_until(
  ranked_scores: readonly RankedScore[],
  boundary_rank: number,
): RunningScore {
  return ranked_scores
    .filter((ranked) => ranked.rank <= boundary_rank)
    .reduce(
      (score, ranked) => credit_points(score, ranked.event, ranked.award),
      { home: 0, away: 0 },
    );
}

function select_reported_boundaries(
  boundaries: PeriodBoundary[],
  ranked_scores: readonly RankedScore[],
): PeriodBoundary[] {
  if (boundaries.length === 0) return [];
  const has_extra_time_points = ranked_scores.some(
    (ranked) => ranked.rank >= boundaries.length,
  );
  return has_extra_time_points
    ? [
        ...boundaries,
        {
          id: EXTRA_TIME_PERIOD_NAME,
          name: EXTRA_TIME_PERIOD_NAME,
          end_minute: Number.POSITIVE_INFINITY,
        },
      ]
    : boundaries.slice(0, -1);
}

export function calculate_score_by_period(
  game_events: readonly GameEvent[],
  periods: readonly ReportScoringPeriod[],
  resolve_score: ScoreAwardResolver,
): MatchScoreByPeriod[] {
  const boundaries = build_playing_boundaries(periods);
  const ranked_scores = rank_scores(
    game_events,
    { boundaries, break_ranks: build_break_ranks(periods) },
    resolve_score,
  );
  return select_reported_boundaries(boundaries, ranked_scores)
    .map((boundary, boundary_rank) => {
      const score = score_until(ranked_scores, boundary_rank);
      return {
        period_name: boundary.name,
        home_score: score.home,
        away_score: score.away,
      };
    })
    .reverse();
}
