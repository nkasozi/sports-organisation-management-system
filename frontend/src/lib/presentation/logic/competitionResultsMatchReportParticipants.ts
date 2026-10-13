import type { Fixture } from "$lib/core/entities/Fixture";
import type { MatchReportBuildContext } from "$lib/infrastructure/utils/MatchReportBuilder";
import {
  build_assigned_officials,
  build_staff_entries,
  type CompetitionResultsMatchReportDependencies,
} from "$lib/presentation/logic/competitionResultsMatchReportHelpers";

type MatchReportParticipants = Pick<
  MatchReportBuildContext,
  | "home_lineup"
  | "away_lineup"
  | "assigned_officials"
  | "home_staff"
  | "away_staff"
>;

type FixtureLineupResult = Awaited<
  ReturnType<
    CompetitionResultsMatchReportDependencies["fixture_lineup_use_cases"]["get_lineup_for_team_in_fixture"]
  >
>;

function extract_selected_lineup_players(
  lineup_result: FixtureLineupResult,
): MatchReportBuildContext["home_lineup"] {
  return lineup_result.success && lineup_result.data
    ? lineup_result.data.selected_players
    : [];
}

export async function fetch_match_report_participants(
  fixture: Fixture,
  staff_roles_map: Map<string, string>,
  dependencies: CompetitionResultsMatchReportDependencies,
): Promise<MatchReportParticipants> {
  const [home_lineup_result, away_lineup_result, home_staff, away_staff] =
    await Promise.all([
      dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture.id,
        fixture.home_team_id,
      ),
      dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture.id,
        fixture.away_team_id,
      ),
      build_staff_entries(
        fixture.home_team_id,
        staff_roles_map,
        dependencies.team_staff_use_cases,
      ),
      build_staff_entries(
        fixture.away_team_id,
        staff_roles_map,
        dependencies.team_staff_use_cases,
      ),
    ]);
  const assigned_officials = await build_assigned_officials(
    fixture,
    dependencies,
  );
  return {
    home_lineup: extract_selected_lineup_players(home_lineup_result),
    away_lineup: extract_selected_lineup_players(away_lineup_result),
    assigned_officials,
    home_staff,
    away_staff,
  };
}
