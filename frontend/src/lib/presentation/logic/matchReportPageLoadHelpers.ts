import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type {
  MatchReportAssignedOfficialData,
  MatchReportCompetitionState,
  MatchReportPageDependencies,
  MatchReportSportState,
  MatchReportVenueState,
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
  competition_state: MatchReportCompetitionState;
  organization_name: string;
  sport_state: MatchReportSportState;
}> {
  if (!fixture.competition_id) {
    return {
      competition_state: { status: "missing" },
      organization_name: "",
      sport_state: { status: "missing" },
    };
  }
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    fixture.competition_id,
  );
  if (!competition_result.success || !competition_result.data) {
    return {
      competition_state: { status: "missing" },
      organization_name: "",
      sport_state: { status: "missing" },
    };
  }
  const competition = competition_result.data;
  if (!competition.organization_id) {
    return {
      competition_state: { status: "present", competition },
      organization_name: "",
      sport_state: { status: "missing" },
    };
  }
  const organization_result =
    await dependencies.organization_use_cases.get_by_id(
      competition.organization_id,
    );
  if (!organization_result.success || !organization_result.data) {
    return {
      competition_state: { status: "present", competition },
      organization_name: "",
      sport_state: { status: "missing" },
    };
  }
  const organization_name = organization_result.data.name;
  if (!organization_result.data.sport_id) {
    return {
      competition_state: { status: "present", competition },
      organization_name,
      sport_state: { status: "missing" },
    };
  }
  const sport_result = await dependencies.sport_use_cases.get_by_id(
    organization_result.data.sport_id,
  );
  return {
    competition_state: { status: "present", competition },
    organization_name,
    sport_state:
      sport_result.success && sport_result.data
        ? { status: "present", sport: sport_result.data }
        : { status: "missing" },
  };
}

type MatchReportAssignedOfficialLoadState =
  | { status: "missing" }
  | {
      status: "present";
      assigned_official_data: MatchReportAssignedOfficialData;
    };

function build_match_report_venue_state(
  venue_result: Awaited<
    ReturnType<MatchReportPageDependencies["venue_use_cases"]["get_by_id"]>
  >,
): MatchReportVenueState {
  if (!venue_result.success || !venue_result.data) {
    return { status: "missing" };
  }

  return { status: "present", venue: venue_result.data };
}

function build_match_report_assigned_official_load_state(
  official_result: Awaited<
    ReturnType<MatchReportPageDependencies["official_use_cases"]["get_by_id"]>
  >,
  role_name: string,
): MatchReportAssignedOfficialLoadState {
  if (!official_result.success || !official_result.data) {
    return { status: "missing" };
  }

  return {
    status: "present",
    assigned_official_data: {
      official: official_result.data,
      role_name,
    },
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
  venue_state: MatchReportVenueState;
}> {
  const venue_state: MatchReportVenueState = fixture.venue
    ? build_match_report_venue_state(
        await dependencies.venue_use_cases.get_by_id(fixture.venue),
      )
    : { status: "missing" };
  if (!fixture.assigned_officials || fixture.assigned_officials.length === 0) {
    return { assigned_officials_data: [], venue_state };
  }
  const assigned_official_results = await Promise.all(
    fixture.assigned_officials.map(
      async (current_assignment: Fixture["assigned_officials"][number]) => {
        const official_result = await dependencies.official_use_cases.get_by_id(
          current_assignment.official_id,
        );
        return build_match_report_assigned_official_load_state(
          official_result,
          String(current_assignment.role_name),
        );
      },
    ),
  );
  return {
    assigned_officials_data: assigned_official_results.flatMap(
      (current_result: MatchReportAssignedOfficialLoadState) =>
        current_result.status === "present"
          ? [current_result.assigned_official_data]
          : [],
    ),
    venue_state,
  };
}
