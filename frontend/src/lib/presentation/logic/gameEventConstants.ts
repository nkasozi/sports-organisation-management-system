import type { GameEvent, GameEventType } from "$lib/core/entities/FixtureTypes";

export const GAME_EVENT_TYPE = {
  GOAL: "goal",
  OWN_GOAL: "own_goal",
  PENALTY_SCORED: "penalty_scored",
  PENALTY_MISSED: "penalty_missed",
  YELLOW_CARD: "yellow_card",
  GREEN_CARD: "green_card",
  RED_CARD: "red_card",
  SECOND_YELLOW: "second_yellow",
  SUBSTITUTION: "substitution",
  FOUL: "foul",
  OFFSIDE: "offside",
  CORNER: "corner",
  FREE_KICK: "free_kick",
  INJURY: "injury",
  VAR_REVIEW: "var_review",
  PERIOD_START: "period_start",
  PERIOD_END: "period_end",
} as const satisfies Record<string, GameEventType>;

export const TEAM_SIDE = {
  HOME: "home",
  AWAY: "away",
  MATCH: "match",
} as const satisfies Record<string, GameEvent["team_side"]>;
