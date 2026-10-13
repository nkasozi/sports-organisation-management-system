import { MINIMUM_TEAMS_REQUIRED } from "./CompetitionFormatConstants";
import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "./CompetitionFormatFactories";
import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  KnockoutStageConfig,
  LeagueConfig,
} from "./CompetitionFormatTypes";
import { DEFAULT_POINTS_CONFIG } from "./CompetitionFormatTypes";
import { hydrate_competition_format_input } from "./CompetitionFormatValidation";
import { ENTITY_STATUS, FORMAT_TYPE } from "./StatusConstants";

export function get_default_competition_formats_for_organization(
  organization_id: NonNullable<CreateCompetitionFormatInput["organization_id"]>,
): CompetitionFormat[] {
  const now = new Date().toISOString();
  const default_inputs = get_default_competition_formats();
  return default_inputs.map(
    (input, index) =>
      ({
        ...input,
        id: `comp_fmt_default_${index + 1}_${organization_id}` as CompetitionFormat["id"],
        created_at: now as CompetitionFormat["created_at"],
        updated_at: now as CompetitionFormat["updated_at"],
        organization_id,
      }) as CompetitionFormat,
  );
}

type DefaultFormatSeed = Pick<
  CreateCompetitionFormatInput,
  | "name"
  | "code"
  | "description"
  | "format_type"
  | "tie_breakers"
  | "max_teams_allowed"
> & {
  knockout_overrides: Partial<KnockoutStageConfig>;
  league_overrides: Partial<LeagueConfig>;
};

const NO_OVERRIDES = {};

const DEFAULT_FORMAT_SEEDS: ReadonlyArray<DefaultFormatSeed> = [
  {
    name: "Standard League",
    code: "standard_league",
    description: "Traditional league format with home and away fixtures",
    format_type: FORMAT_TYPE.LEAGUE,
    tie_breakers: ["goal_difference", "head_to_head", "goals_scored"],
    max_teams_allowed: 24,
    knockout_overrides: NO_OVERRIDES,
    league_overrides: NO_OVERRIDES,
  },
  {
    name: "Single Round Robin",
    code: "single_round_robin",
    description: "Each team plays every other team once",
    format_type: FORMAT_TYPE.ROUND_ROBIN,
    tie_breakers: ["goal_difference", "goals_scored"],
    max_teams_allowed: 16,
    knockout_overrides: NO_OVERRIDES,
    league_overrides: { number_of_rounds: 1 },
  },
  {
    name: "World Cup Style",
    code: "world_cup_style",
    description: "Group stage followed by knockout rounds",
    format_type: FORMAT_TYPE.GROUPS_KNOCKOUT,
    tie_breakers: [
      "goal_difference",
      "goals_scored",
      "head_to_head",
      "fair_play",
    ],
    max_teams_allowed: 32,
    knockout_overrides: NO_OVERRIDES,
    league_overrides: NO_OVERRIDES,
  },
  {
    name: "Cup Tournament",
    code: "cup_tournament",
    description: "Single elimination knockout tournament",
    format_type: FORMAT_TYPE.STRAIGHT_KNOCKOUT,
    tie_breakers: ["draw"],
    max_teams_allowed: 64,
    knockout_overrides: { third_place_match: false },
    league_overrides: NO_OVERRIDES,
  },
  {
    name: "Champions League Style",
    code: "champions_league_style",
    description: "Group stage with two-legged knockout rounds",
    format_type: FORMAT_TYPE.GROUPS_KNOCKOUT,
    tie_breakers: ["goal_difference", "away_goals", "goals_scored"],
    max_teams_allowed: 32,
    knockout_overrides: { two_legged_ties: true, away_goals_rule: true },
    league_overrides: NO_OVERRIDES,
  },
];

function build_default_format_input(
  seed: DefaultFormatSeed,
): CreateCompetitionFormatInput {
  const { knockout_overrides, league_overrides, ...identity } = seed;
  return hydrate_competition_format_input({
    ...identity,
    tie_breakers: [...identity.tie_breakers],
    points_config: { ...DEFAULT_POINTS_CONFIG },
    group_stage_config: create_default_group_stage_config(),
    knockout_stage_config: {
      ...create_default_knockout_stage_config(),
      ...knockout_overrides,
    },
    league_config: { ...create_default_league_config(), ...league_overrides },
    stage_templates: [],
    min_teams_required: MINIMUM_TEAMS_REQUIRED,
    status: ENTITY_STATUS.ACTIVE,
  });
}

function get_default_competition_formats(): CreateCompetitionFormatInput[] {
  return DEFAULT_FORMAT_SEEDS.map(build_default_format_input);
}
