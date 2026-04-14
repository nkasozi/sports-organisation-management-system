import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Sport } from "$lib/core/entities/Sport";
import type { Venue } from "$lib/core/entities/Venue";
import { create_success_result, type Result } from "$lib/core/types/Result";
import type {
  MatchReportAssignedOfficialData,
  MatchReportPageDependencies,
} from "$lib/presentation/logic/matchReportPageLoadTypes";

export async function load_match_report_lineups(
  fixture: Fixture,
  dependencies: Pick<MatchReportPageDependencies, "fixture_lineup_use_cases">,
): Promise<{ home_players: LineupPlayer[]; away_players: LineupPlayer[] }> {
  const [home_lineup_result, away_lineup_result] = await Promise.all([
    dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
      fixture.id,
      fixture.home_team_id,
    ),
    dependencies.fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
      fixture.id,
      fixture.away_team_id,
    ),
  ]);
  return {
    home_players:
      home_lineup_result.success && home_lineup_result.data
        ? home_lineup_result.data.selected_players
        : [],
    away_players:
      away_lineup_result.success && away_lineup_result.data
        ? away_lineup_result.data.selected_players
        : [],
  };
}

export async function load_match_report_competition_bundle(
  fixture: Fixture,
  dependencies: Pick<
    MatchReportPageDependencies,
    "competition_use_cases" | "organization_use_cases" | "sport_use_cases"
  >,
): Promise<{
  competition: Competition | null;
  organization_name: string;
  sport: Sport | null;
}> {
  if (!fixture.competition_id) {
    return { competition: null, organization_name: "", sport: null };
  }
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    fixture.competition_id,
  );
  if (!competition_result.success || !competition_result.data) {
    return { competition: null, organization_name: "", sport: null };
  }
  const competition = competition_result.data;
  if (!competition.organization_id) {
    return { competition, organization_name: "", sport: null };
  }
  const organization_result =
    await dependencies.organization_use_cases.get_by_id(
      competition.organization_id,
    );
  if (!organization_result.success || !organization_result.data) {
    return { competition, organization_name: "", sport: null };
  }
  const organization_name = organization_result.data.name;
  if (!organization_result.data.sport_id) {
    return { competition, organization_name, sport: null };
  }
  const sport_result = await dependencies.sport_use_cases.get_by_id(
    organization_result.data.sport_id,
  );
  return {
    competition,
    organization_name,
    sport: sport_result.success ? sport_result.data : null,
  };
}

export async function load_match_report_assigned_officials(
  fixture: Fixture,
  dependencies: Pick<
    MatchReportPageDependencies,
    "official_use_cases" | "venue_use_cases"
  >,
): Promise<{
  assigned_officials_data: MatchReportAssignedOfficialData[];
  venue_result: Result<Venue | null>;
}> {
  const venue_result = fixture.venue
    ? await dependencies.venue_use_cases.get_by_id(fixture.venue)
    : create_success_result(null as Venue | null);
  if (!fixture.assigned_officials || fixture.assigned_officials.length === 0) {
    return { assigned_officials_data: [], venue_result };
  }
  const assigned_official_results = await Promise.all(
    fixture.assigned_officials.map(
      async (current_assignment: Fixture["assigned_officials"][number]) => {
        const official_result = await dependencies.official_use_cases.get_by_id(
          current_assignment.official_id,
        );
        if (!official_result.success || !official_result.data) {
          return null;
        }
        return {
          official: official_result.data,
          role_name: String(current_assignment.role_name),
        };
      },
    ),
  );
  return {
    assigned_officials_data: assigned_official_results.filter(
      (
        current_result: MatchReportAssignedOfficialData | null,
      ): current_result is MatchReportAssignedOfficialData =>
        current_result !== null,
    ),
    venue_result,
  };
}
