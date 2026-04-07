import type { Fixture } from "$lib/core/entities/Fixture";

import type { FormResult } from "./competitionStageResults";

export function build_team_form_map(
  completed_fixtures: Fixture[],
  last_n: number,
): Map<string, FormResult[]> {
  const team_fixture_results = new Map<
    string,
    Array<{ date: string; result: FormResult }>
  >();

  for (const fixture of completed_fixtures) {
    const home_goals = fixture.home_team_score ?? 0;
    const away_goals = fixture.away_team_score ?? 0;
    const date = fixture.scheduled_date ?? fixture.created_at ?? "";

    const home_result: FormResult =
      home_goals > away_goals ? "W" : home_goals === away_goals ? "D" : "L";
    const away_result: FormResult =
      away_goals > home_goals ? "W" : away_goals === home_goals ? "D" : "L";

    if (!team_fixture_results.has(fixture.home_team_id)) {
      team_fixture_results.set(fixture.home_team_id, []);
    }
    if (!team_fixture_results.has(fixture.away_team_id)) {
      team_fixture_results.set(fixture.away_team_id, []);
    }

    team_fixture_results
      .get(fixture.home_team_id)!
      .push({ date, result: home_result });
    team_fixture_results
      .get(fixture.away_team_id)!
      .push({ date, result: away_result });
  }

  const form_map = new Map<string, FormResult[]>();
  for (const [team_id, results] of team_fixture_results) {
    const sorted = [...results].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );
    form_map.set(
      team_id,
      sorted.slice(-last_n).map((r) => r.result),
    );
  }
  return form_map;
}
