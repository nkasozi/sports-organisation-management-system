import type { PointsConfig } from "$lib/core/entities/CompetitionFormat";
import type { Fixture } from "$lib/core/entities/Fixture";

interface MiniLeagueRecord {
  points: number;
  goal_difference: number;
  goals_for: number;
}

const EMPTY_RECORD: MiniLeagueRecord = {
  points: 0,
  goal_difference: 0,
  goals_for: 0,
};

function result_points(
  goals_for: number,
  goals_against: number,
  points_config: PointsConfig,
): number {
  if (goals_for > goals_against) return points_config.points_for_win;
  return goals_for === goals_against
    ? points_config.points_for_draw
    : points_config.points_for_loss;
}

function add_result(
  record: MiniLeagueRecord,
  goals_for: number,
  goals_against: number,
  points_config: PointsConfig,
): MiniLeagueRecord {
  return {
    points:
      record.points + result_points(goals_for, goals_against, points_config),
    goal_difference: record.goal_difference + goals_for - goals_against,
    goals_for: record.goals_for + goals_for,
  };
}

function is_between_group(
  fixture: Fixture,
  group_ids: ReadonlySet<string>,
): boolean {
  return (
    group_ids.has(fixture.home_team_id) && group_ids.has(fixture.away_team_id)
  );
}

export function compute_mini_league(
  team_ids: string[],
  completed_fixtures: Fixture[],
  points_config: PointsConfig,
): Map<string, MiniLeagueRecord> {
  const group_ids = new Set(team_ids);
  const records = new Map<string, MiniLeagueRecord>(
    team_ids.map((team_id) => [team_id, EMPTY_RECORD]),
  );
  for (const fixture of completed_fixtures) {
    if (!is_between_group(fixture, group_ids)) continue;
    const home_goals = fixture.home_team_score ?? 0;
    const away_goals = fixture.away_team_score ?? 0;
    const home_record = records.get(fixture.home_team_id) ?? EMPTY_RECORD;
    const away_record = records.get(fixture.away_team_id) ?? EMPTY_RECORD;
    records.set(
      fixture.home_team_id,
      add_result(home_record, home_goals, away_goals, points_config),
    );
    records.set(
      fixture.away_team_id,
      add_result(away_record, away_goals, home_goals, points_config),
    );
  }
  return records;
}
