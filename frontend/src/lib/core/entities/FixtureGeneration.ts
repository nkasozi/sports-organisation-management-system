import type { CreateFixtureInput } from "./FixtureTypes";
import { FIXTURE_STATUS } from "./StatusConstants";

const BYE_TEAM_IDENTIFIER = "BYE";
const ROUND_NAME_PREFIX = "Round ";
const ISO_DATE_TIME_SEPARATOR = "T";
const DAYS_BETWEEN_ROUNDS = 7;
const NO_VENUE = "";
const NO_STAGE_ID = "";

const VENUE_ROTATION = {
  HOME_AWAY: "home_away",
  NEUTRAL: "neutral",
  SINGLE_VENUE: "single_venue",
} as const;

type TeamId = CreateFixtureInput["home_team_id"];

type FixtureGenerationTeamIdentifier = TeamId | typeof BYE_TEAM_IDENTIFIER;

type FixtureVenuePlan =
  | {
      venue_rotation:
        | typeof VENUE_ROTATION.HOME_AWAY
        | typeof VENUE_ROTATION.NEUTRAL;
    }
  | {
      venue_rotation: typeof VENUE_ROTATION.SINGLE_VENUE;
      single_venue: CreateFixtureInput["venue"];
    };

export type FixtureGenerationConfig = FixtureVenuePlan & {
  organization_id: CreateFixtureInput["organization_id"];
  competition_id: CreateFixtureInput["competition_id"];
  team_ids: TeamId[];
  start_date: CreateFixtureInput["scheduled_date"];
  match_days_per_week: number[];
  default_time: CreateFixtureInput["scheduled_time"];
  rounds: number;
  stage_id_per_round: Record<number, CreateFixtureInput["stage_id"]>;
};

type Pairing = { home_team_id: TeamId; away_team_id: TeamId };

type RoundSchedule = {
  round_number: number;
  scheduled_date: CreateFixtureInput["scheduled_date"];
  venue: CreateFixtureInput["venue"];
};

export function generate_round_robin_fixtures(
  config: FixtureGenerationConfig,
): CreateFixtureInput[] {
  const initial_teams = with_bye_for_odd_count(config.team_ids);
  const rounds_per_leg = initial_teams.length - 1;
  const total_rounds = rounds_per_leg * config.rounds;
  const venue = resolve_venue(config);
  const fixtures: CreateFixtureInput[] = [];
  let teams = initial_teams;

  for (let round_index = 0; round_index < total_rounds; round_index++) {
    const schedule: RoundSchedule = {
      round_number: round_index + 1,
      scheduled_date: add_days_iso(config.start_date, round_index),
      venue,
    };
    const is_reverse_leg = round_index >= rounds_per_leg;
    for (const pairing of build_round_pairings(teams, is_reverse_leg)) {
      fixtures.push(build_fixture_input(config, schedule, pairing));
    }
    teams = rotate_teams(teams);
  }

  return fixtures;
}

function with_bye_for_odd_count(
  team_ids: TeamId[],
): FixtureGenerationTeamIdentifier[] {
  return team_ids.length % 2 === 0
    ? [...team_ids]
    : [...team_ids, BYE_TEAM_IDENTIFIER];
}

function resolve_venue(
  config: FixtureGenerationConfig,
): CreateFixtureInput["venue"] {
  switch (config.venue_rotation) {
    case VENUE_ROTATION.SINGLE_VENUE:
      return config.single_venue;
    case VENUE_ROTATION.HOME_AWAY:
    case VENUE_ROTATION.NEUTRAL:
      return NO_VENUE;
  }
}

function add_days_iso(
  start_date: CreateFixtureInput["scheduled_date"],
  round_index: number,
): CreateFixtureInput["scheduled_date"] {
  const date = new Date(start_date);
  date.setDate(date.getDate() + round_index * DAYS_BETWEEN_ROUNDS);
  return date.toISOString().split(ISO_DATE_TIME_SEPARATOR)[0];
}

function build_round_pairings(
  teams: FixtureGenerationTeamIdentifier[],
  is_reverse_leg: boolean,
): Pairing[] {
  const half = teams.length / 2;
  return Array.from({ length: half }, (_, match_index) => {
    const first = teams[match_index];
    const second = teams[teams.length - 1 - match_index];
    return is_reverse_leg ? [second, first] : [first, second];
  }).flatMap(([home, away]) =>
    home === BYE_TEAM_IDENTIFIER || away === BYE_TEAM_IDENTIFIER
      ? []
      : [{ home_team_id: home, away_team_id: away }],
  );
}

function rotate_teams(
  teams: FixtureGenerationTeamIdentifier[],
): FixtureGenerationTeamIdentifier[] {
  return [teams[0], ...teams.slice(-1), ...teams.slice(1, -1)];
}

function build_fixture_input(
  config: FixtureGenerationConfig,
  schedule: RoundSchedule,
  pairing: Pairing,
): CreateFixtureInput {
  return {
    organization_id: config.organization_id,
    competition_id: config.competition_id,
    round_number: schedule.round_number,
    round_name: `${ROUND_NAME_PREFIX}${schedule.round_number}`,
    home_team_id: pairing.home_team_id,
    away_team_id: pairing.away_team_id,
    venue: schedule.venue,
    scheduled_date: schedule.scheduled_date,
    scheduled_time: config.default_time,
    assigned_officials: [],
    match_day: schedule.round_number,
    notes: "",
    stage_id: config.stage_id_per_round[schedule.round_number] ?? NO_STAGE_ID,
    status: FIXTURE_STATUS.SCHEDULED,
  };
}
