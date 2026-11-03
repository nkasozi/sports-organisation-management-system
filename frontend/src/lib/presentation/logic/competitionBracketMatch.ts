import type { Fixture } from "$lib/core/entities/Fixture";
import { build_fixture_kickoff_date_time } from "$lib/core/entities/FixtureKickoff";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";

import { PRESENCE_STATUS } from "./presenceStatus";

export const BRACKET_OUTCOME_STATUS = {
  DECIDED: "decided",
  UNDECIDED: "undecided",
} as const;

export type BracketOutcome =
  | { status: typeof BRACKET_OUTCOME_STATUS.DECIDED; winner_team_id: string }
  | { status: typeof BRACKET_OUTCOME_STATUS.UNDECIDED };

export type BracketScore =
  | { status: typeof PRESENCE_STATUS.PRESENT; value: number }
  | { status: typeof PRESENCE_STATUS.MISSING };

export interface BracketTeamLine {
  team_id: string;
  score: BracketScore;
}

export interface BracketMatch {
  fixture_id: string;
  kickoff: string;
  home: BracketTeamLine;
  away: BracketTeamLine;
  outcome: BracketOutcome;
}

const STARTED_FIXTURE_STATUSES: readonly string[] = [
  FIXTURE_STATUS.IN_PROGRESS,
  FIXTURE_STATUS.COMPLETED,
];

function build_score(fixture: Fixture, goals: number): BracketScore {
  return STARTED_FIXTURE_STATUSES.includes(fixture.status)
    ? { status: PRESENCE_STATUS.PRESENT, value: goals }
    : { status: PRESENCE_STATUS.MISSING };
}

function decide_outcome(fixture: Fixture): BracketOutcome {
  if (fixture.status !== FIXTURE_STATUS.COMPLETED)
    return { status: BRACKET_OUTCOME_STATUS.UNDECIDED };
  const score_margin = fixture.home_team_score - fixture.away_team_score;
  const shootout_margin =
    (fixture.shootout_home_score ?? 0) - (fixture.shootout_away_score ?? 0);
  const deciding_margin = score_margin === 0 ? shootout_margin : score_margin;
  if (deciding_margin === 0)
    return { status: BRACKET_OUTCOME_STATUS.UNDECIDED };
  return {
    status: BRACKET_OUTCOME_STATUS.DECIDED,
    winner_team_id:
      deciding_margin > 0 ? fixture.home_team_id : fixture.away_team_id,
  };
}

export function build_bracket_match(fixture: Fixture): BracketMatch {
  return {
    fixture_id: fixture.id,
    kickoff: build_fixture_kickoff_date_time(fixture),
    home: {
      team_id: fixture.home_team_id,
      score: build_score(fixture, fixture.home_team_score),
    },
    away: {
      team_id: fixture.away_team_id,
      score: build_score(fixture, fixture.away_team_score),
    },
    outcome: decide_outcome(fixture),
  };
}
