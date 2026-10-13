import type { GameEvent } from "$lib/core/entities/Fixture";
import {
  SCORE_AWARD_KIND,
  SCORE_CREDITED_SIDE,
  type ScoreAward,
  type ScoreAwardResolver,
} from "$lib/core/entities/SportEventCatalog";
import type { MatchScoreByPeriod } from "$lib/core/types/MatchReportTypes";

import { SCORING_TEAM_SIDE } from "./matchReportScoringConstants";

export interface ReportScoringPeriod {
  name: string;
  duration_minutes: number;
  is_break: boolean;
}

type RunningScore = { home: number; away: number };

type PeriodBoundary = { name: string; end_minute: number };

function build_playing_boundaries(
  periods: readonly ReportScoringPeriod[],
): PeriodBoundary[] {
  let elapsed_minutes = 0;
  return periods
    .filter((period) => !period.is_break)
    .map((period) => {
      elapsed_minutes += period.duration_minutes;
      return { name: period.name, end_minute: elapsed_minutes };
    });
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
  game_events: readonly GameEvent[],
  end_minute: number,
  resolve_score: ScoreAwardResolver,
): RunningScore {
  return game_events
    .filter((event) => event.minute <= end_minute)
    .reduce(
      (score, event) =>
        credit_points(score, event, resolve_score(event.event_type)),
      { home: 0, away: 0 },
    );
}

function has_points_after(
  game_events: readonly GameEvent[],
  end_minute: number,
  resolve_score: ScoreAwardResolver,
): boolean {
  return game_events.some(
    (event) =>
      event.minute > end_minute &&
      resolve_score(event.event_type).kind === SCORE_AWARD_KIND.CREDIT,
  );
}

function select_reported_boundaries(
  boundaries: PeriodBoundary[],
  game_events: readonly GameEvent[],
  resolve_score: ScoreAwardResolver,
): PeriodBoundary[] {
  const regulation_end = boundaries.at(-1);
  if (!regulation_end) return [];
  return has_points_after(game_events, regulation_end.end_minute, resolve_score)
    ? boundaries
    : boundaries.slice(0, -1);
}

export function calculate_score_by_period(
  game_events: readonly GameEvent[],
  periods: readonly ReportScoringPeriod[],
  resolve_score: ScoreAwardResolver,
): MatchScoreByPeriod[] {
  return select_reported_boundaries(
    build_playing_boundaries(periods),
    game_events,
    resolve_score,
  )
    .map((boundary) => {
      const score = score_until(
        game_events,
        boundary.end_minute,
        resolve_score,
      );
      return {
        period_name: boundary.name,
        home_score: score.home,
        away_score: score.away,
      };
    })
    .reverse();
}
