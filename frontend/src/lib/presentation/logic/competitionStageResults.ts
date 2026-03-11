import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";

export interface TeamStanding {
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
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

export function calculate_team_standings(
  fixtures: Fixture[],
  teams: Team[],
): TeamStanding[] {
  const standings_map = new Map<string, TeamStanding>();

  for (const team of teams) {
    standings_map.set(team.id, {
      team_id: team.id,
      team_name: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    });
  }

  const completed_fixtures = fixtures.filter(
    (fixture) => fixture.status === "completed",
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
      home_standing.points += 3;
      continue;
    }

    if (away_goals > home_goals) {
      away_standing.won += 1;
      home_standing.lost += 1;
      away_standing.points += 3;
      continue;
    }

    home_standing.drawn += 1;
    away_standing.drawn += 1;
    home_standing.points += 1;
    away_standing.points += 1;
  }

  for (const standing of standings_map.values()) {
    standing.goal_difference = standing.goals_for - standing.goals_against;
  }

  return [...standings_map.values()].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }
    if (right.goal_difference !== left.goal_difference) {
      return right.goal_difference - left.goal_difference;
    }
    return right.goals_for - left.goals_for;
  });
}

export function infer_group_stage_team_groups(fixtures: Fixture[]): string[][] {
  const adjacency_map = new Map<string, Set<string>>();
  const first_seen_index = new Map<string, number>();

  for (const [index, fixture] of fixtures.entries()) {
    const team_ids = [fixture.home_team_id, fixture.away_team_id].filter(
      (team_id) => team_id.trim().length > 0,
    );
    for (const team_id of team_ids) {
      if (!adjacency_map.has(team_id)) {
        adjacency_map.set(team_id, new Set());
      }
      if (!first_seen_index.has(team_id)) {
        first_seen_index.set(team_id, index);
      }
    }

    if (team_ids.length !== 2) {
      continue;
    }

    adjacency_map.get(team_ids[0])?.add(team_ids[1]);
    adjacency_map.get(team_ids[1])?.add(team_ids[0]);
  }

  const visited_team_ids = new Set<string>();
  const inferred_groups: string[][] = [];

  for (const team_id of adjacency_map.keys()) {
    if (visited_team_ids.has(team_id)) {
      continue;
    }

    const pending_team_ids = [team_id];
    const group_team_ids: string[] = [];

    while (pending_team_ids.length > 0) {
      const current_team_id = pending_team_ids.pop();
      if (!current_team_id || visited_team_ids.has(current_team_id)) {
        continue;
      }

      visited_team_ids.add(current_team_id);
      group_team_ids.push(current_team_id);

      const adjacent_team_ids = adjacency_map.get(current_team_id) ?? new Set();
      for (const adjacent_team_id of adjacent_team_ids) {
        if (!visited_team_ids.has(adjacent_team_id)) {
          pending_team_ids.push(adjacent_team_id);
        }
      }
    }

    group_team_ids.sort(
      (left, right) =>
        (first_seen_index.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (first_seen_index.get(right) ?? Number.MAX_SAFE_INTEGER),
    );
    inferred_groups.push(group_team_ids);
  }

  inferred_groups.sort(
    (left, right) =>
      (first_seen_index.get(left[0]) ?? Number.MAX_SAFE_INTEGER) -
      (first_seen_index.get(right[0]) ?? Number.MAX_SAFE_INTEGER),
  );

  return inferred_groups;
}

export function build_competition_stage_results_sections(
  stages: CompetitionStage[],
  fixtures: Fixture[],
  teams: Team[],
): CompetitionStageResultsSection[] {
  const team_map = new Map(teams.map((team) => [team.id, team]));
  const sections: CompetitionStageResultsSection[] = [];

  for (const stage of [...stages].sort(
    (left, right) => left.stage_order - right.stage_order,
  )) {
    const stage_fixtures = fixtures.filter(
      (fixture) => fixture.stage_id === stage.id,
    );

    if (stage.stage_type === "group_stage") {
      const inferred_groups = infer_group_stage_team_groups(stage_fixtures).map(
        (team_ids, index) => {
          const group_team_set = new Set(team_ids);
          const group_fixtures = stage_fixtures.filter(
            (fixture) =>
              group_team_set.has(fixture.home_team_id) &&
              group_team_set.has(fixture.away_team_id),
          );
          const group_teams = team_ids
            .map((team_id) => team_map.get(team_id))
            .filter((team): team is Team => team !== undefined);

          return {
            label: `Group ${String.fromCharCode(65 + index)}`,
            team_ids,
            fixtures: group_fixtures,
            standings: calculate_team_standings(group_fixtures, group_teams),
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
      stage.stage_type === "league_stage" || stage.stage_type === "custom";
    const stage_team_ids = new Set<string>();
    for (const fixture of stage_fixtures) {
      stage_team_ids.add(fixture.home_team_id);
      stage_team_ids.add(fixture.away_team_id);
    }
    const stage_teams = [...stage_team_ids]
      .map((team_id) => team_map.get(team_id))
      .filter((team): team is Team => team !== undefined);

    sections.push({
      stage,
      fixtures: stage_fixtures,
      standings: can_show_stage_standings
        ? calculate_team_standings(stage_fixtures, stage_teams)
        : [],
      inferred_groups: [],
    });
  }

  return sections;
}
