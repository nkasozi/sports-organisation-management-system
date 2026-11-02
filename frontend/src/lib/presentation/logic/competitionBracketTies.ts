import type { Fixture } from "$lib/core/entities/Fixture";
import { build_fixture_kickoff_date_time } from "$lib/core/entities/FixtureKickoff";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";

import { PRESENCE_STATUS } from "./presenceStatus";

const TIE_KEY_SEPARATOR = "|";

export const BRACKET_OUTCOME_STATUS = {
  DECIDED: "decided",
  UNDECIDED: "undecided",
} as const;

export type BracketTieOutcome =
  | { status: typeof BRACKET_OUTCOME_STATUS.DECIDED; winner_team_id: string }
  | { status: typeof BRACKET_OUTCOME_STATUS.UNDECIDED };

export type BracketScore =
  | { status: typeof PRESENCE_STATUS.PRESENT; value: number }
  | { status: typeof PRESENCE_STATUS.MISSING };

export interface BracketTeamLine {
  team_id: string;
  score: BracketScore;
}

const STARTED_FIXTURE_STATUSES: readonly string[] = [
  FIXTURE_STATUS.IN_PROGRESS,
  FIXTURE_STATUS.COMPLETED,
];

export interface BracketTie {
  tie_id: string;
  fixtures: Fixture[];
  first_team: BracketTeamLine;
  second_team: BracketTeamLine;
  outcome: BracketTieOutcome;
  kickoff: string;
}

function build_tie_key(fixture: Fixture): string {
  return [fixture.home_team_id, fixture.away_team_id]
    .sort()
    .join(TIE_KEY_SEPARATOR);
}

function has_started(fixture: Fixture): boolean {
  return STARTED_FIXTURE_STATUSES.includes(fixture.status);
}

function score_for_team(fixtures: Fixture[], team_id: string): BracketScore {
  const started_legs = fixtures.filter(has_started);
  if (started_legs.length === 0) return { status: PRESENCE_STATUS.MISSING };
  return {
    status: PRESENCE_STATUS.PRESENT,
    value: sum_team_goals(started_legs, team_id),
  };
}

function score_value(score: BracketScore): number {
  return score.status === PRESENCE_STATUS.PRESENT ? score.value : 0;
}

function sum_team_goals(fixtures: Fixture[], team_id: string): number {
  return fixtures.reduce(
    (total: number, fixture: Fixture) =>
      total +
      (fixture.home_team_id === team_id
        ? fixture.home_team_score
        : fixture.away_team_score),
    0,
  );
}

function shootout_score_for_team(fixture: Fixture, team_id: string): number {
  const home_shootout_score = fixture.shootout_home_score ?? 0;
  const away_shootout_score = fixture.shootout_away_score ?? 0;
  return fixture.home_team_id === team_id
    ? home_shootout_score
    : away_shootout_score;
}

function decide_tie_outcome(
  fixtures: Fixture[],
  first_team: BracketTeamLine,
  second_team: BracketTeamLine,
): BracketTieOutcome {
  const is_finished = fixtures.every(
    (fixture: Fixture) => fixture.status === FIXTURE_STATUS.COMPLETED,
  );
  if (!is_finished) return { status: BRACKET_OUTCOME_STATUS.UNDECIDED };
  const deciding_leg = fixtures[fixtures.length - 1];
  const score_margin =
    score_value(first_team.score) - score_value(second_team.score);
  const shootout_margin =
    shootout_score_for_team(deciding_leg, first_team.team_id) -
    shootout_score_for_team(deciding_leg, second_team.team_id);
  const deciding_margin = score_margin === 0 ? shootout_margin : score_margin;
  if (deciding_margin === 0)
    return { status: BRACKET_OUTCOME_STATUS.UNDECIDED };
  return {
    status: BRACKET_OUTCOME_STATUS.DECIDED,
    winner_team_id:
      deciding_margin > 0 ? first_team.team_id : second_team.team_id,
  };
}

function build_tie(fixtures: Fixture[]): BracketTie {
  const ordered_legs = [...fixtures].sort((left: Fixture, right: Fixture) =>
    build_fixture_kickoff_date_time(left).localeCompare(
      build_fixture_kickoff_date_time(right),
    ),
  );
  const opening_leg = ordered_legs[0];
  const first_team = {
    team_id: opening_leg.home_team_id,
    score: score_for_team(ordered_legs, opening_leg.home_team_id),
  };
  const second_team = {
    team_id: opening_leg.away_team_id,
    score: score_for_team(ordered_legs, opening_leg.away_team_id),
  };
  return {
    tie_id: opening_leg.id,
    fixtures: ordered_legs,
    first_team,
    second_team,
    outcome: decide_tie_outcome(ordered_legs, first_team, second_team),
    kickoff: build_fixture_kickoff_date_time(opening_leg),
  };
}

export function group_fixtures_into_ties(fixtures: Fixture[]): BracketTie[] {
  const legs_by_tie = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const tie_key = build_tie_key(fixture);
    legs_by_tie.set(tie_key, [...(legs_by_tie.get(tie_key) ?? []), fixture]);
  }
  return [...legs_by_tie.values()]
    .map(build_tie)
    .sort(
      (left: BracketTie, right: BracketTie) =>
        left.kickoff.localeCompare(right.kickoff) ||
        left.tie_id.localeCompare(right.tie_id),
    );
}
