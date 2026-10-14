import {
  DEFAULT_POINTS_CONFIG,
  type PointsConfig,
  type TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { STAGE_TYPE } from "$lib/core/entities/StatusConstants";
import type { Team } from "$lib/core/entities/Team";

import {
  DEFAULT_FAIR_PLAY_CARD_WEIGHTS,
  type FairPlayCardWeights,
} from "./competitionStandingsFairPlay";
import { calculate_team_standings } from "./competitionTeamStandings";
import { infer_group_stage_team_groups } from "./groupStageInference";

export { calculate_team_standings } from "./competitionTeamStandings";

export type FormResult = "W" | "D" | "L";

export interface TeamStanding {
  team_id: string;
  team_name: string;
  team_logo_url: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: FormResult[];
  requires_playoff: boolean;
}
export interface InferredStageGroup {
  label: string;
  team_ids: string[];
  fixtures: Fixture[];
  standings: TeamStanding[];
}
export interface CompetitionStageResultsSection {
  stage: CompetitionStage;
  fixtures: Fixture[];
  standings: TeamStanding[];
  inferred_groups: InferredStageGroup[];
}

interface StageSectionContext {
  team_map: Map<string, Team>;
  points_config: PointsConfig;
  tie_breakers: TieBreaker[];
  card_weights: FairPlayCardWeights;
}

function collect_present_teams(
  team_ids: string[],
  team_map: Map<string, Team>,
): Team[] {
  const teams: Team[] = [];

  for (const team_id of team_ids) {
    const team = team_map.get(team_id);

    if (team) {
      teams.push(team);
    }
  }

  return teams;
}

export { infer_group_stage_team_groups } from "./groupStageInference";

function build_inferred_stage_group(
  team_ids: string[],
  index: number,
  stage_fixtures: Fixture[],
  context: StageSectionContext,
): InferredStageGroup {
  const group_team_set = new Set(team_ids);
  const group_fixtures = stage_fixtures.filter(
    (fixture) =>
      group_team_set.has(fixture.home_team_id) &&
      group_team_set.has(fixture.away_team_id),
  );
  const group_teams = collect_present_teams(team_ids, context.team_map);
  return {
    label: `Group ${String.fromCharCode(65 + index)}`,
    team_ids,
    fixtures: group_fixtures,
    standings: calculate_team_standings(
      group_fixtures,
      group_teams,
      context.points_config,
      context.tie_breakers,
      context.card_weights,
    ),
  };
}

function build_group_stage_section(
  stage: CompetitionStage,
  stage_fixtures: Fixture[],
  context: StageSectionContext,
): CompetitionStageResultsSection {
  return {
    stage,
    fixtures: stage_fixtures,
    standings: [],
    inferred_groups: infer_group_stage_team_groups(stage_fixtures).map(
      (team_ids, index) =>
        build_inferred_stage_group(team_ids, index, stage_fixtures, context),
    ),
  };
}

function build_regular_stage_section(
  stage: CompetitionStage,
  stage_fixtures: Fixture[],
  context: StageSectionContext,
): CompetitionStageResultsSection {
  const can_show_stage_standings =
    stage.stage_type === STAGE_TYPE.LEAGUE_STAGE ||
    stage.stage_type === STAGE_TYPE.CUSTOM;
  const stage_team_ids = new Set<string>();
  for (const fixture of stage_fixtures) {
    stage_team_ids.add(fixture.home_team_id);
    stage_team_ids.add(fixture.away_team_id);
  }
  const stage_teams = collect_present_teams(
    [...stage_team_ids],
    context.team_map,
  );
  return {
    stage,
    fixtures: stage_fixtures,
    standings: can_show_stage_standings
      ? calculate_team_standings(
          stage_fixtures,
          stage_teams,
          context.points_config,
          context.tie_breakers,
          context.card_weights,
        )
      : [],
    inferred_groups: [],
  };
}

export function build_competition_stage_results_sections(
  stages: CompetitionStage[],
  fixtures: Fixture[],
  teams: Team[],
  points_config: PointsConfig = DEFAULT_POINTS_CONFIG,
  tie_breakers: TieBreaker[] = ["goal_difference", "goals_scored"],
  card_weights: FairPlayCardWeights = DEFAULT_FAIR_PLAY_CARD_WEIGHTS,
): CompetitionStageResultsSection[] {
  const context: StageSectionContext = {
    team_map: new Map<string, Team>(teams.map((team) => [team.id, team])),
    points_config,
    tie_breakers,
    card_weights,
  };
  return [...stages]
    .sort((left, right) => left.stage_order - right.stage_order)
    .map((stage) => {
      const stage_fixtures = fixtures.filter(
        (fixture) => fixture.stage_id === stage.id,
      );
      return stage.stage_type === STAGE_TYPE.GROUP_STAGE
        ? build_group_stage_section(stage, stage_fixtures, context)
        : build_regular_stage_section(stage, stage_fixtures, context);
    });
}
