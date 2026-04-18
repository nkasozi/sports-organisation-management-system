import {
  DEFAULT_POINTS_CONFIG,
  type PointsConfig,
  type TieBreaker,
} from "$lib/core/entities/CompetitionFormat";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS, STAGE_TYPE } from "$lib/core/entities/StatusConstants";
import type { Team } from "$lib/core/entities/Team";

import { build_team_form_map } from "./competitionStandingsForm";
import { sort_standings_by_tiebreakers } from "./competitionStandingsTiebreakers";
import { infer_group_stage_team_groups } from "./groupStageInference";

export type FormResult = "W" | "D" | "L";

const FORM_LAST_N_GAMES = 5;

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

export function calculate_team_standings(
  fixtures: Fixture[],
  teams: Team[],
  points_config: PointsConfig = DEFAULT_POINTS_CONFIG,
  tie_breakers: TieBreaker[] = ["goal_difference", "goals_scored"],
): TeamStanding[] {
  const standings_map = new Map<string, TeamStanding>();
  for (const team of teams) {
    standings_map.set(team.id, {
      team_id: team.id,
      team_name: team.name,
      team_logo_url: team.logo_url ?? "",
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
      form: [],
    });
  }
  const completed_fixtures = fixtures.filter(
    (fixture) => fixture.status === FIXTURE_STATUS.COMPLETED,
  );
  for (const fixture of completed_fixtures) {
    const home_standing = standings_map.get(fixture.home_team_id);
    const away_standing = standings_map.get(fixture.away_team_id);
    if (!home_standing || !away_standing) {
      continue;
    }
    const home_goals = fixture.home_team_score ?? 0;
    const away_goals = fixture.away_team_score ?? 0;
    home_standing.played += 1;
    away_standing.played += 1;
    home_standing.goals_for += home_goals;
    home_standing.goals_against += away_goals;
    away_standing.goals_for += away_goals;
    away_standing.goals_against += home_goals;
    if (home_goals > away_goals) {
      home_standing.won += 1;
      away_standing.lost += 1;
      home_standing.points += points_config.points_for_win;
      away_standing.points += points_config.points_for_loss;
      continue;
    }
    if (away_goals > home_goals) {
      away_standing.won += 1;
      home_standing.lost += 1;
      away_standing.points += points_config.points_for_win;
      home_standing.points += points_config.points_for_loss;
      continue;
    }

    home_standing.drawn += 1;
    away_standing.drawn += 1;
    home_standing.points += points_config.points_for_draw;
    away_standing.points += points_config.points_for_draw;
  }
  for (const standing of standings_map.values()) {
    standing.goal_difference = standing.goals_for - standing.goals_against;
  }
  const form_map = build_team_form_map(completed_fixtures, FORM_LAST_N_GAMES);
  for (const standing of standings_map.values()) {
    standing.form = form_map.get(standing.team_id) ?? [];
  }

  return sort_standings_by_tiebreakers(
    [...standings_map.values()],
    completed_fixtures,
    tie_breakers,
  );
}

export { infer_group_stage_team_groups } from "./groupStageInference";

export function build_competition_stage_results_sections(
  stages: CompetitionStage[],
  fixtures: Fixture[],
  teams: Team[],
  points_config: PointsConfig = DEFAULT_POINTS_CONFIG,
  tie_breakers: TieBreaker[] = ["goal_difference", "goals_scored"],
): CompetitionStageResultsSection[] {
  const team_map = new Map<string, Team>(teams.map((team) => [team.id, team]));
  const sections: CompetitionStageResultsSection[] = [];
  for (const stage of [...stages].sort(
    (left, right) => left.stage_order - right.stage_order,
  )) {
    const stage_fixtures = fixtures.filter(
      (fixture) => fixture.stage_id === stage.id,
    );
    if (stage.stage_type === STAGE_TYPE.GROUP_STAGE) {
      const inferred_groups = infer_group_stage_team_groups(stage_fixtures).map(
        (team_ids, index) => {
          const group_team_set = new Set(team_ids);
          const group_fixtures = stage_fixtures.filter(
            (fixture) =>
              group_team_set.has(fixture.home_team_id) &&
              group_team_set.has(fixture.away_team_id),
          );
          const group_teams = collect_present_teams(team_ids, team_map);
          return {
            label: `Group ${String.fromCharCode(65 + index)}`,
            team_ids,
            fixtures: group_fixtures,
            standings: calculate_team_standings(
              group_fixtures,
              group_teams,
              points_config,
              tie_breakers,
            ),
          };
        },
      );
      sections.push({
        stage,
        fixtures: stage_fixtures,
        standings: [],
        inferred_groups,
      });
      continue;
    }
    const can_show_stage_standings =
      stage.stage_type === STAGE_TYPE.LEAGUE_STAGE ||
      stage.stage_type === STAGE_TYPE.CUSTOM;
    const stage_team_ids = new Set<string>();
    for (const fixture of stage_fixtures) {
      stage_team_ids.add(fixture.home_team_id);
      stage_team_ids.add(fixture.away_team_id);
    }
    const stage_teams = collect_present_teams([...stage_team_ids], team_map);
    sections.push({
      stage,
      fixtures: stage_fixtures,
      standings: can_show_stage_standings
        ? calculate_team_standings(
            stage_fixtures,
            stage_teams,
            points_config,
            tie_breakers,
          )
        : [],
      inferred_groups: [],
    });
  }
  return sections;
}
