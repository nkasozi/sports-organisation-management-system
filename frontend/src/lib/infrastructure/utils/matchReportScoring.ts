import { GAME_PERIOD } from "../../core/entities/StatusConstants";
import type { GameEvent } from "$lib/core/entities/Fixture";
import type { MatchScoreByPeriod } from "$lib/core/types/MatchReportTypes";

const GOAL_TYPES = new Set(["goal", "own_goal", "penalty_scored"]);

const PERIOD_NAMES = {
  first_half: "First Period",
  half_time: "Half-time",
  third_period: "Third Period",
} as const;

function infer_period_from_minute(minute: number): string {
  if (minute <= 45) return GAME_PERIOD.FIRST_HALF;
  if (minute <= 90) return GAME_PERIOD.SECOND_HALF;
  if (minute <= 105) return GAME_PERIOD.EXTRA_TIME_FIRST;
  return GAME_PERIOD.EXTRA_TIME_SECOND;
}

export function calculate_score_by_period(
  game_events: GameEvent[],
  home_initials: string,
  away_initials: string,
): MatchScoreByPeriod[] {
  const period_scores: Record<string, { home: number; away: number }> = {
    first_half: { home: 0, away: 0 },
    second_half: { home: 0, away: 0 },
    extra_time_first: { home: 0, away: 0 },
    extra_time_second: { home: 0, away: 0 },
  };

  for (const event of game_events) {
    if (!GOAL_TYPES.has(event.event_type)) continue;

    const period = infer_period_from_minute(event.minute);
    if (!period_scores[period]) continue;

    const is_home_goal =
      event.team_side === "home" && event.event_type !== "own_goal";
    const is_away_own_goal =
      event.team_side === "away" && event.event_type === "own_goal";

    if (is_home_goal || is_away_own_goal) {
      period_scores[period].home++;
    } else {
      period_scores[period].away++;
    }
  }

  return build_cumulative_periods(period_scores);
}

function build_cumulative_periods(
  period_scores: Record<string, { home: number; away: number }>,
): MatchScoreByPeriod[] {
  const periods: MatchScoreByPeriod[] = [];

  let cumulative_home = period_scores.first_half.home;
  let cumulative_away = period_scores.first_half.away;
  periods.push({
    period_name: PERIOD_NAMES.first_half,
    home_score: cumulative_home,
    away_score: cumulative_away,
  });

  cumulative_home += period_scores.second_half.home;
  cumulative_away += period_scores.second_half.away;
  periods.push({
    period_name: PERIOD_NAMES.half_time,
    home_score: cumulative_home,
    away_score: cumulative_away,
  });

  const has_extra_time =
    period_scores.extra_time_first.home > 0 ||
    period_scores.extra_time_first.away > 0 ||
    period_scores.extra_time_second.home > 0 ||
    period_scores.extra_time_second.away > 0;

  if (has_extra_time) {
    cumulative_home +=
      period_scores.extra_time_first.home +
      period_scores.extra_time_second.home;
    cumulative_away +=
      period_scores.extra_time_first.away +
      period_scores.extra_time_second.away;
    periods.push({
      period_name: PERIOD_NAMES.third_period,
      home_score: cumulative_home,
      away_score: cumulative_away,
    });
  }

  return periods.reverse();
}
