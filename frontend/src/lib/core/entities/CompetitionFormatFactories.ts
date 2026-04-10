import type {
  CreateCompetitionFormatInput,
  FormatType,
  GroupStageConfig,
  KnockoutStageConfig,
  LeagueConfig,
} from "./CompetitionFormatTypes";
import { DEFAULT_POINTS_CONFIG } from "./CompetitionFormatTypes";

const FORMAT_TYPE_OPTIONS = [
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

const TIE_BREAKER_OPTIONS = [
  { value: "goal_difference", label: "Goal Difference" },
  { value: "head_to_head", label: "Head to Head" },
  { value: "goals_scored", label: "Goals Scored" },
  { value: "away_goals", label: "Away Goals" },
  { value: "fair_play", label: "Fair Play Points" },
  { value: "draw", label: "Draw/Lots" },
  { value: "playoff", label: "Playoff Match" },
] as const;

function get_format_type_label(format_type: FormatType): string {
  const found = FORMAT_TYPE_OPTIONS.find((opt) => opt.value === format_type);
  return found?.label ?? format_type;
}

function get_format_type_description(format_type: FormatType): string {
  const found = FORMAT_TYPE_OPTIONS.find((opt) => opt.value === format_type);
  return found?.description ?? "";
}

function create_empty_competition_format_input(): CreateCompetitionFormatInput {
  return {
    name: "",
    code: "",
    description: "",
    format_type: "league",
    points_config: { ...DEFAULT_POINTS_CONFIG },
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
    stage_templates: [],
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
