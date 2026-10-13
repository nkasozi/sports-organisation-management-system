import type { Fixture } from "$lib/core/entities/Fixture";
import {
  FIXTURE_STATUS,
  GAME_PERIOD,
} from "$lib/core/entities/StatusConstants";

export const LIVE_MATCH_PHASE = {
  NOT_STARTED: "not_started",
  IN_PLAY: "in_play",
  AWAITING_FULL_TIME: "awaiting_full_time",
  COMPLETED: "completed",
  INACTIVE: "inactive",
} as const;

type LiveMatchPhase = (typeof LIVE_MATCH_PHASE)[keyof typeof LIVE_MATCH_PHASE];

type MatchPhaseSource = Pick<Fixture, "status" | "current_period">;

function derive_in_progress_phase(source: MatchPhaseSource): LiveMatchPhase {
  return source.current_period === GAME_PERIOD.FINISHED
    ? LIVE_MATCH_PHASE.AWAITING_FULL_TIME
    : LIVE_MATCH_PHASE.IN_PLAY;
}

export function derive_live_match_phase(
  source: MatchPhaseSource,
): LiveMatchPhase {
  switch (source.status) {
    case FIXTURE_STATUS.SCHEDULED:
      return LIVE_MATCH_PHASE.NOT_STARTED;
    case FIXTURE_STATUS.IN_PROGRESS:
      return derive_in_progress_phase(source);
    case FIXTURE_STATUS.COMPLETED:
      return LIVE_MATCH_PHASE.COMPLETED;
    case FIXTURE_STATUS.POSTPONED:
    case FIXTURE_STATUS.CANCELLED:
    default:
      return LIVE_MATCH_PHASE.INACTIVE;
  }
}

export function is_live_match_in_play(source: MatchPhaseSource): boolean {
  return derive_live_match_phase(source) === LIVE_MATCH_PHASE.IN_PLAY;
}

export function derive_optional_fixture_match_phase(
  fixture: MatchPhaseSource | undefined,
): LiveMatchPhase {
  return fixture ? derive_live_match_phase(fixture) : LIVE_MATCH_PHASE.INACTIVE;
}
