import { build_round_dates } from "./FixtureGenerationSchedule";
import type { CreateFixtureInput } from "./FixtureTypes";
import { FIXTURE_STATUS } from "./StatusConstants";

const BYE_TEAM_IDENTIFIER = "BYE";
const ROUND_NAME_PREFIX = "Round ";
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

type RoundOrientation = {
  is_reverse_leg: boolean;
  is_fixed_team_away: boolean;
};

const FIXED_TEAM_MATCH_INDEX = 0;

type Pairing = { home_team_id: TeamId; away_team_id: TeamId };

type RoundSchedule = {
  round_number: number;
  scheduled_date: CreateFixtureInput["scheduled_date"];
  venue: CreateFixtureInput["venue"];
};

export function count_generated_rounds(
  config: Pick<FixtureGenerationConfig, "team_ids" | "rounds">,
): number {
  return (with_bye_for_odd_count(config.team_ids).length - 1) * config.rounds;
}

function is_reverse_leg_round(
  round_index: number,
  rounds_per_leg: number,
): boolean {
  return Math.floor(round_index / rounds_per_leg) % 2 === 1;
}

export function generate_round_robin_fixtures(
  config: FixtureGenerationConfig,
): CreateFixtureInput[] {
  const initial_teams = with_bye_for_odd_count(config.team_ids);
  const rounds_per_leg = initial_teams.length - 1;
  const total_rounds = count_generated_rounds(config);
  const round_dates = build_round_dates(
    config.start_date,
    config.match_days_per_week ?? [],
    total_rounds,
  );
  const venue = resolve_venue(config);
  const fixtures: CreateFixtureInput[] = [];
  let teams = initial_teams;

  for (let round_index = 0; round_index < total_rounds; round_index++) {
    const schedule: RoundSchedule = {
      round_number: round_index + 1,
      scheduled_date: round_dates[round_index],
      venue,
    };
    const orientation: RoundOrientation = {
      is_reverse_leg: is_reverse_leg_round(round_index, rounds_per_leg),
      is_fixed_team_away: (round_index % rounds_per_leg) % 2 === 1,
    };
    for (const pairing of build_round_pairings(teams, orientation)) {
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

function should_swap_pairing(
  match_index: number,
  orientation: RoundOrientation,
): boolean {
  const is_fixed_team_swapped =
    match_index === FIXED_TEAM_MATCH_INDEX && orientation.is_fixed_team_away;
  return is_fixed_team_swapped !== orientation.is_reverse_leg;
}

function build_round_pairings(
  teams: FixtureGenerationTeamIdentifier[],
  orientation: RoundOrientation,
): Pairing[] {
  const half = teams.length / 2;
  return Array.from({ length: half }, (_, match_index) => {
    const first = teams[match_index];
    const second = teams[teams.length - 1 - match_index];
    return should_swap_pairing(match_index, orientation)
      ? [second, first]
      : [first, second];
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
