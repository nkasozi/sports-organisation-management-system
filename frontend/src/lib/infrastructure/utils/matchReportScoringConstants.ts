import type { GameEvent } from "$lib/core/entities/Fixture";

export const SCORING_TEAM_SIDE = {
  HOME: "home",
  AWAY: "away",
  MATCH: "match",
} as const satisfies Record<string, GameEvent["team_side"]>;
