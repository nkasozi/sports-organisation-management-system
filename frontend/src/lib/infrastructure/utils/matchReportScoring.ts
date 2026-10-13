import type { GameEvent } from "$lib/core/entities/Fixture";
import type { MatchScoreByPeriod } from "$lib/core/types/MatchReportTypes";

import { GAME_PERIOD } from "../../core/entities/StatusConstants";
import {
  PERIOD_MINUTE_LIMITS,
  SCORE_PERIOD_NAMES,
  SCORING_EVENT_TYPE,
  SCORING_TEAM_SIDE,
} from "./matchReportScoringConstants";

type ScoringPeriod =
  | typeof GAME_PERIOD.FIRST_HALF
  | typeof GAME_PERIOD.SECOND_HALF
  | typeof GAME_PERIOD.EXTRA_TIME_FIRST
  | typeof GAME_PERIOD.EXTRA_TIME_SECOND;

type ScoringSide = "home" | "away";

type PeriodScores = Record<ScoringPeriod, Record<ScoringSide, number>>;

const GOAL_TYPES: ReadonlySet<GameEvent["event_type"]> = new Set([
  SCORING_EVENT_TYPE.GOAL,
  SCORING_EVENT_TYPE.OWN_GOAL,
  SCORING_EVENT_TYPE.PENALTY_SCORED,
]);

function infer_period_from_minute(minute: number): ScoringPeriod {
  if (minute <= PERIOD_MINUTE_LIMITS.FIRST_HALF) return GAME_PERIOD.FIRST_HALF;
  if (minute <= PERIOD_MINUTE_LIMITS.SECOND_HALF)
    return GAME_PERIOD.SECOND_HALF;
  if (minute <= PERIOD_MINUTE_LIMITS.EXTRA_TIME_FIRST) {
    return GAME_PERIOD.EXTRA_TIME_FIRST;
  }
  return GAME_PERIOD.EXTRA_TIME_SECOND;
}

function resolve_scoring_side(event: GameEvent): ScoringSide {
  const is_own_goal = event.event_type === SCORING_EVENT_TYPE.OWN_GOAL;
  const is_home_goal =
    event.team_side === SCORING_TEAM_SIDE.HOME && !is_own_goal;
  const is_away_own_goal =
    event.team_side === SCORING_TEAM_SIDE.AWAY && is_own_goal;
  return is_home_goal || is_away_own_goal
    ? SCORING_TEAM_SIDE.HOME
    : SCORING_TEAM_SIDE.AWAY;
}

function create_empty_period_scores(): PeriodScores {
  return {
    [GAME_PERIOD.FIRST_HALF]: { home: 0, away: 0 },
    [GAME_PERIOD.SECOND_HALF]: { home: 0, away: 0 },
    [GAME_PERIOD.EXTRA_TIME_FIRST]: { home: 0, away: 0 },
    [GAME_PERIOD.EXTRA_TIME_SECOND]: { home: 0, away: 0 },
  };
}

export function calculate_score_by_period(
  game_events: GameEvent[],
): MatchScoreByPeriod[] {
  const period_scores = create_empty_period_scores();
  for (const event of game_events) {
    if (!GOAL_TYPES.has(event.event_type)) continue;
    const period = infer_period_from_minute(event.minute);
    period_scores[period][resolve_scoring_side(event)]++;
  }
  return build_cumulative_periods(period_scores);
}

function has_extra_time_goals(period_scores: PeriodScores): boolean {
  const first = period_scores[GAME_PERIOD.EXTRA_TIME_FIRST];
  const second = period_scores[GAME_PERIOD.EXTRA_TIME_SECOND];
  return first.home + first.away + second.home + second.away > 0;
}

function build_cumulative_periods(
  period_scores: PeriodScores,
): MatchScoreByPeriod[] {
  const first = period_scores[GAME_PERIOD.FIRST_HALF];
  const second = period_scores[GAME_PERIOD.SECOND_HALF];
  const extra_first = period_scores[GAME_PERIOD.EXTRA_TIME_FIRST];
  const extra_second = period_scores[GAME_PERIOD.EXTRA_TIME_SECOND];
  const half_time_home = first.home + second.home;
  const half_time_away = first.away + second.away;
  const periods: MatchScoreByPeriod[] = [
    {
      period_name: SCORE_PERIOD_NAMES.first_half,
      home_score: first.home,
      away_score: first.away,
    },
    {
      period_name: SCORE_PERIOD_NAMES.half_time,
      home_score: half_time_home,
      away_score: half_time_away,
    },
  ];
  if (has_extra_time_goals(period_scores)) {
    periods.push({
      period_name: SCORE_PERIOD_NAMES.third_period,
      home_score: half_time_home + extra_first.home + extra_second.home,
      away_score: half_time_away + extra_first.away + extra_second.away,
    });
  }
  return periods.reverse();
}
