import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "./CompetitionFormatFactories";
import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
} from "./CompetitionFormatTypes";
import { hydrate_competition_format_input } from "./CompetitionFormatValidation";

export function get_default_competition_formats_for_organization(
  organization_id: string,
): CompetitionFormat[] {
  const now = new Date().toISOString();
  const default_inputs = get_default_competition_formats();
  return default_inputs.map((input, index) => ({
    ...input,
    id: `comp_fmt_default_${index + 1}_${organization_id}`,
    created_at: now,
    updated_at: now,
    organization_id,
  }));
}

export function get_default_competition_formats(): CreateCompetitionFormatInput[] {
  return [
    hydrate_competition_format_input({
      name: "Standard League",
      code: "standard_league",
      description: "Traditional league format with home and away fixtures",
      format_type: "league",
      points_config: {
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
      },
      tie_breakers: ["goal_difference", "head_to_head", "goals_scored"],
      group_stage_config: null,
      knockout_stage_config: null,
      league_config: create_default_league_config(),
      stage_templates: [],
      min_teams_required: 2,
      max_teams_allowed: 24,
      status: "active",
    }),
    hydrate_competition_format_input({
      name: "Single Round Robin",
      code: "single_round_robin",
      description: "Each team plays every other team once",
      format_type: "round_robin",
      points_config: {
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
      },
      tie_breakers: ["goal_difference", "goals_scored"],
      group_stage_config: null,
      knockout_stage_config: null,
      league_config: { ...create_default_league_config(), number_of_rounds: 1 },
      stage_templates: [],
      min_teams_required: 2,
      max_teams_allowed: 16,
      status: "active",
    }),
    hydrate_competition_format_input({
      name: "World Cup Style",
      code: "world_cup_style",
      description: "Group stage followed by knockout rounds",
      format_type: "groups_knockout",
      points_config: {
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
      },
      tie_breakers: [
        "goal_difference",
        "goals_scored",
        "head_to_head",
        "fair_play",
      ],
      group_stage_config: create_default_group_stage_config(),
      knockout_stage_config: create_default_knockout_stage_config(),
      league_config: null,
      stage_templates: [],
      min_teams_required: 2,
      max_teams_allowed: 32,
      status: "active",
    }),
    hydrate_competition_format_input({
      name: "Cup Tournament",
      code: "cup_tournament",
      description: "Single elimination knockout tournament",
      format_type: "straight_knockout",
      points_config: {
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
      },
      tie_breakers: ["draw"],
      group_stage_config: null,
      knockout_stage_config: {
        ...create_default_knockout_stage_config(),
        third_place_match: false,
      },
      league_config: null,
      stage_templates: [],
      min_teams_required: 2,
      max_teams_allowed: 64,
      status: "active",
    }),
    hydrate_competition_format_input({
      name: "Champions League Style",
      code: "champions_league_style",
      description: "Group stage with two-legged knockout rounds",
      format_type: "groups_knockout",
      points_config: {
        points_for_win: 3,
        points_for_draw: 1,
        points_for_loss: 0,
      },
      tie_breakers: ["goal_difference", "away_goals", "goals_scored"],
      group_stage_config: create_default_group_stage_config(),
      knockout_stage_config: {
        ...create_default_knockout_stage_config(),
        two_legged_ties: true,
        away_goals_rule: true,
      },
      league_config: null,
      stage_templates: [],
      min_teams_required: 2,
      max_teams_allowed: 32,
      status: "active",
    }),
  ];
}
