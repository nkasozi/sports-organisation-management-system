import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Venue } from "$lib/core/entities/Venue";
import { type Option, OptionStatus } from "$lib/core/types/Option";
import type {
  MatchReportAssignedOfficialData,
  MatchReportPageDependencies,
  MatchReportVenueState,
} from "$lib/presentation/logic/matchReportPageLoadTypes";

import { find_fixture_venue } from "./fixtureVenueLookup";
import { PRESENCE_STATUS } from "./presenceStatus";

export { load_match_report_competition_bundle } from "./matchReportPageLoadCompetition";

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

type MatchReportAssignedOfficialLoadState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | {
      status: typeof PRESENCE_STATUS.PRESENT;
      assigned_official_data: MatchReportAssignedOfficialData;
    };

function build_match_report_venue_state(
  venue: Option<Venue>,
): MatchReportVenueState {
  switch (venue.status) {
    case OptionStatus.NONE:
      return { status: PRESENCE_STATUS.MISSING };
    case OptionStatus.SOME:
      return { status: PRESENCE_STATUS.PRESENT, venue: venue.value };
  }
}

function build_match_report_assigned_official_load_state(
  official_result: Awaited<
    ReturnType<MatchReportPageDependencies["official_use_cases"]["get_by_id"]>
  >,
  role_name: string,
): MatchReportAssignedOfficialLoadState {
  if (!official_result.success || !official_result.data) {
    return { status: PRESENCE_STATUS.MISSING };
  }

  return {
    status: PRESENCE_STATUS.PRESENT,
    assigned_official_data: {
      official: official_result.data,
      role_name,
    },
  };
}

async function load_match_report_assigned_official(
  current_assignment: Fixture["assigned_officials"][number],
  dependencies: Pick<MatchReportPageDependencies, "official_use_cases">,
): Promise<MatchReportAssignedOfficialLoadState> {
  const official_result = await dependencies.official_use_cases.get_by_id(
    current_assignment.official_id,
  );
  return build_match_report_assigned_official_load_state(
    official_result,
    String(current_assignment.role_name),
  );
}

export async function load_match_report_assigned_officials(
  fixture: Fixture,
  dependencies: Pick<
    MatchReportPageDependencies,
    "official_use_cases" | "venue_use_cases"
  >,
): Promise<{
  assigned_officials_data: MatchReportAssignedOfficialData[];
  venue_state: MatchReportVenueState;
}> {
  const venue_state = build_match_report_venue_state(
    await find_fixture_venue(fixture.venue ?? "", dependencies.venue_use_cases),
  );
  if (!fixture.assigned_officials || fixture.assigned_officials.length === 0) {
    return { assigned_officials_data: [], venue_state };
  }
  const assigned_official_results = await Promise.all(
    fixture.assigned_officials.map(
      (current_assignment: Fixture["assigned_officials"][number]) =>
        load_match_report_assigned_official(current_assignment, dependencies),
    ),
  );
  return {
    assigned_officials_data: assigned_official_results.flatMap(
      (current_result: MatchReportAssignedOfficialLoadState) =>
        current_result.status === PRESENCE_STATUS.PRESENT
          ? [current_result.assigned_official_data]
          : [],
    ),
    venue_state,
  };
}
