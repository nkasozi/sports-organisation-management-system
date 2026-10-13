import type {
  GroupStageConfig,
  KnockoutStageConfig,
  LeagueConfig,
} from "./CompetitionFormatTypes";

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
