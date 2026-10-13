import type { GameEvent } from "$lib/core/entities/Fixture";

export const SCORING_EVENT_TYPE = {
  GOAL: "goal",
  OWN_GOAL: "own_goal",
  PENALTY_SCORED: "penalty_scored",
} as const satisfies Record<string, GameEvent["event_type"]>;

export const SCORING_TEAM_SIDE = {
  HOME: "home",
  AWAY: "away",
  MATCH: "match",
} as const satisfies Record<string, GameEvent["team_side"]>;

export const SCORE_PERIOD_NAMES = {
  first_half: "First Period",
  half_time: "Half-time",
  third_period: "Third Period",
} as const;

export const PERIOD_MINUTE_LIMITS = {
  FIRST_HALF: 45,
  SECOND_HALF: 90,
  EXTRA_TIME_FIRST: 105,
} as const;
