import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type FormatType =
  | "league"
  | "round_robin"
  | "groups_knockout"
  | "straight_knockout"
  | "groups_playoffs"
  | "double_elimination"
  | "swiss"
  | "custom";

export type TieBreaker =
  | "goal_difference"
  | "head_to_head"
  | "goals_scored"
  | "away_goals"
  | "fair_play"
  | "draw"
  | "playoff";

export interface GroupStageConfig {
  number_of_groups: number;
  teams_per_group: number;
  teams_advancing_per_group: number;
  matches_per_round: number;
}

export interface KnockoutStageConfig {
  number_of_rounds: number;
  third_place_match: boolean;
  two_legged_ties: boolean;
  away_goals_rule: boolean;
  extra_time_enabled: boolean;
  penalty_shootout_enabled: boolean;
}

export interface LeagueConfig {
  number_of_rounds: number;
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
  promotion_spots: number;
  relegation_spots: number;
  playoff_spots: number;
}

export interface CompetitionFormat extends BaseEntity {
  name: string;
  code: string;
  description: string;
  format_type: FormatType;
  tie_breakers: TieBreaker[];
  group_stage_config: GroupStageConfig | null;
  knockout_stage_config: KnockoutStageConfig | null;
  league_config: LeagueConfig | null;
  min_teams_required: number;
  max_teams_allowed: number;
  status: EntityStatus;
}

export type CreateCompetitionFormatInput = Omit<
  CompetitionFormat,
  "id" | "created_at" | "updated_at"
>;
export type UpdateCompetitionFormatInput =
  Partial<CreateCompetitionFormatInput>;

export const FORMAT_TYPE_OPTIONS = [
  {
    value: "league",
    label: "League",
    description: "Teams play multiple rounds against each other",
  },
  {
    value: "round_robin",
    label: "Round Robin",
    description: "Each team plays every other team once",
  },
  {
    value: "groups_knockout",
    label: "Groups + Knockout",
    description: "Group stage followed by knockout rounds",
  },
  {
    value: "straight_knockout",
    label: "Straight Knockout",
    description: "Single elimination tournament",
  },
  {
    value: "groups_playoffs",
    label: "Groups + Playoffs",
    description: "Group stage followed by playoff series",
  },
  {
    value: "double_elimination",
    label: "Double Elimination",
    description: "Teams must lose twice to be eliminated",
  },
  {
    value: "swiss",
    label: "Swiss System",
    description: "Teams paired based on similar records",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Custom format with manual fixture creation",
  },
] as const;

export const TIE_BREAKER_OPTIONS = [
  { value: "goal_difference", label: "Goal Difference" },
  { value: "head_to_head", label: "Head to Head" },
  { value: "goals_scored", label: "Goals Scored" },
  { value: "away_goals", label: "Away Goals" },
  { value: "fair_play", label: "Fair Play Points" },
  { value: "draw", label: "Draw/Lots" },
  { value: "playoff", label: "Playoff Match" },
] as const;

export function get_format_type_label(format_type: FormatType): string {
  const found = FORMAT_TYPE_OPTIONS.find((opt) => opt.value === format_type);
  return found?.label ?? format_type;
}

export function get_format_type_description(format_type: FormatType): string {
  const found = FORMAT_TYPE_OPTIONS.find((opt) => opt.value === format_type);
  return found?.description ?? "";
}

export function create_empty_competition_format_input(): CreateCompetitionFormatInput {
  return {
    name: "",
    code: "",
    description: "",
    format_type: "league",
    tie_breakers: ["goal_difference", "head_to_head", "goals_scored"],
    group_stage_config: null,
    knockout_stage_config: null,
    league_config: {
      number_of_rounds: 2,
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
      promotion_spots: 0,
      relegation_spots: 0,
      playoff_spots: 0,
    },
    min_teams_required: 2,
    max_teams_allowed: 32,
    status: "active",
  };
}

export function create_default_group_stage_config(): GroupStageConfig {
  return {
    number_of_groups: 4,
    teams_per_group: 4,
    teams_advancing_per_group: 2,
    matches_per_round: 1,
  };
}

export function create_default_knockout_stage_config(): KnockoutStageConfig {
  return {
    number_of_rounds: 4,
    third_place_match: true,
    two_legged_ties: false,
    away_goals_rule: false,
    extra_time_enabled: true,
    penalty_shootout_enabled: true,
  };
}

export function create_default_league_config(): LeagueConfig {
  return {
    number_of_rounds: 2,
    points_for_win: 3,
    points_for_draw: 1,
    points_for_loss: 0,
    promotion_spots: 0,
    relegation_spots: 0,
    playoff_spots: 0,
  };
}

export function validate_competition_format_input(
  input: CreateCompetitionFormatInput,
): { is_valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!input.code || input.code.trim().length === 0) {
    errors.push("Code is required");
  }

  if (input.min_teams_required < 2) {
    errors.push("Minimum teams required must be at least 2");
  }

  if (input.max_teams_allowed < input.min_teams_required) {
    errors.push("Maximum teams must be greater than or equal to minimum teams");
  }

  const requires_group_config = ["groups_knockout", "groups_playoffs"].includes(
    input.format_type,
  );
  if (requires_group_config && !input.group_stage_config) {
    errors.push("Group stage configuration is required for this format type");
  }

  const requires_knockout_config = [
    "groups_knockout",
    "straight_knockout",
    "double_elimination",
  ].includes(input.format_type);
  if (requires_knockout_config && !input.knockout_stage_config) {
    errors.push(
      "Knockout stage configuration is required for this format type",
    );
  }

  const requires_league_config = ["league", "round_robin"].includes(
    input.format_type,
  );
  if (requires_league_config && !input.league_config) {
    errors.push("League configuration is required for this format type");
  }

  return { is_valid: errors.length === 0, errors };
}

export function get_default_competition_formats(): CreateCompetitionFormatInput[] {
  return [
    {
      name: "Standard League",
      code: "standard_league",
      description: "Traditional league format with home and away fixtures",
      format_type: "league",
      tie_breakers: ["goal_difference", "head_to_head", "goals_scored"],
      group_stage_config: null,
      knockout_stage_config: null,
      league_config: create_default_league_config(),
      min_teams_required: 4,
      max_teams_allowed: 24,
      status: "active",
    },
    {
      name: "Single Round Robin",
      code: "single_round_robin",
      description: "Each team plays every other team once",
      format_type: "round_robin",
      tie_breakers: ["goal_difference", "goals_scored"],
      group_stage_config: null,
      knockout_stage_config: null,
      league_config: { ...create_default_league_config(), number_of_rounds: 1 },
      min_teams_required: 3,
      max_teams_allowed: 16,
      status: "active",
    },
    {
      name: "World Cup Style",
      code: "world_cup_style",
      description: "Group stage followed by knockout rounds",
      format_type: "groups_knockout",
      tie_breakers: [
        "goal_difference",
        "goals_scored",
        "head_to_head",
        "fair_play",
      ],
      group_stage_config: create_default_group_stage_config(),
      knockout_stage_config: create_default_knockout_stage_config(),
      league_config: null,
      min_teams_required: 8,
      max_teams_allowed: 32,
      status: "active",
    },
    {
      name: "Cup Tournament",
      code: "cup_tournament",
      description: "Single elimination knockout tournament",
      format_type: "straight_knockout",
      tie_breakers: ["draw"],
      group_stage_config: null,
      knockout_stage_config: {
        ...create_default_knockout_stage_config(),
        third_place_match: false,
      },
      league_config: null,
      min_teams_required: 4,
      max_teams_allowed: 64,
      status: "active",
    },
    {
      name: "Champions League Style",
      code: "champions_league_style",
      description: "Group stage with two-legged knockout rounds",
      format_type: "groups_knockout",
      tie_breakers: ["goal_difference", "away_goals", "goals_scored"],
      group_stage_config: create_default_group_stage_config(),
      knockout_stage_config: {
        ...create_default_knockout_stage_config(),
        two_legged_ties: true,
        away_goals_rule: true,
      },
      league_config: null,
      min_teams_required: 16,
      max_teams_allowed: 32,
      status: "active",
    },
  ];
}
