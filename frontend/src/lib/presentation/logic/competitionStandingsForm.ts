import type { Fixture } from "$lib/core/entities/Fixture";

import type { FormResult } from "./competitionStageResults";

type DatedFormResult = { date: string; result: FormResult };

function determine_form_result(
  goals_for: number,
  goals_against: number,
): FormResult {
  return goals_for > goals_against
    ? "W"
    : goals_for === goals_against
      ? "D"
      : "L";
}

function append_team_form_result(
  team_fixture_results: Map<string, DatedFormResult[]>,
  team_id: string,
  dated_result: DatedFormResult,
): void {
  const existing_results = team_fixture_results.get(team_id) ?? [];
  existing_results.push(dated_result);
  team_fixture_results.set(team_id, existing_results);
}

function select_latest_form_results(
  results: DatedFormResult[],
  last_n: number,
): FormResult[] {
  const sorted = [...results].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
  return sorted.slice(-last_n).map((r) => r.result);
}

export function build_team_form_map(
  completed_fixtures: Fixture[],
  last_n: number,
): Map<string, FormResult[]> {
  const team_fixture_results = new Map<string, DatedFormResult[]>();

  for (const fixture of completed_fixtures) {
    const home_goals = fixture.home_team_score ?? 0;
    const away_goals = fixture.away_team_score ?? 0;
    const date = fixture.scheduled_date ?? fixture.created_at ?? "";
    append_team_form_result(team_fixture_results, fixture.home_team_id, {
      date,
      result: determine_form_result(home_goals, away_goals),
    });
    append_team_form_result(team_fixture_results, fixture.away_team_id, {
      date,
      result: determine_form_result(away_goals, home_goals),
    });
  }

  const form_map = new Map<string, FormResult[]>();
  for (const [team_id, results] of team_fixture_results) {
    form_map.set(team_id, select_latest_form_results(results, last_n));
  }
  return form_map;
}
