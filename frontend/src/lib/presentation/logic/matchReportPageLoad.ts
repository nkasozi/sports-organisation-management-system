import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

const MATCH_REPORT_PAGE_LOAD_MESSAGE = {
  fixture_not_found: "Failed to load match",
} as const;

export interface MatchReportAssignedOfficialData {
  official: Official;
  role_name: string;
}

export interface MatchReportPageData {
  fixture: Fixture;
  home_team: Team | null;
  away_team: Team | null;
  competition: Competition | null;
  sport: Sport | null;
  venue: Venue | null;
  organization_name: string;
  assigned_officials_data: MatchReportAssignedOfficialData[];
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
}

export interface MatchReportRefreshData {
  fixture: Fixture;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
}

interface MatchReportLineupResult {
  selected_players: LineupPlayer[];
}

interface MatchReportOrganizationResult {
  name: string;
  sport_id?: string;
}

export interface MatchReportPageDependencies {
  fixture_use_cases: {
    get_by_id(id: string): AsyncResult<Fixture>;
  };
  team_use_cases: {
    get_by_id(id: string): AsyncResult<Team>;
  };
  fixture_lineup_use_cases: {
    get_lineup_for_team_in_fixture(
      fixture_id: string,
      team_id: string,
    ): AsyncResult<MatchReportLineupResult>;
  };
  competition_use_cases: {
    get_by_id(id: string): AsyncResult<Competition>;
  };
  organization_use_cases: {
    get_by_id(id: string): AsyncResult<MatchReportOrganizationResult>;
  };
  sport_use_cases: {
    get_by_id(id: string): AsyncResult<Sport>;
  };
  venue_use_cases: {
    get_by_id(id: string): AsyncResult<Venue>;
  };
  official_use_cases: {
    get_by_id(id: string): AsyncResult<Official>;
  };
}

export interface MatchReportRefreshDependencies {
  fixture_use_cases: MatchReportPageDependencies["fixture_use_cases"];
  fixture_lineup_use_cases: MatchReportPageDependencies["fixture_lineup_use_cases"];
}

async function load_match_report_lineups(
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

async function load_match_report_competition_bundle(
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

async function load_match_report_assigned_officials(
  fixture: Fixture,
  dependencies: Pick<MatchReportPageDependencies, "official_use_cases">,
): Promise<MatchReportAssignedOfficialData[]> {
  if (!fixture.assigned_officials || fixture.assigned_officials.length === 0) {
    return [];
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
          role_name: current_assignment.role_name,
        };
      },
    ),
  );

  return assigned_official_results.filter(
    (
      current_result: MatchReportAssignedOfficialData | null,
    ): current_result is MatchReportAssignedOfficialData =>
      current_result !== null,
  );
}

export async function load_match_report_page_data(command: {
  fixture_id: string;
  dependencies: MatchReportPageDependencies;
}): AsyncResult<MatchReportPageData> {
  const fixture_result = await command.dependencies.fixture_use_cases.get_by_id(
    command.fixture_id,
  );
  if (!fixture_result.success || !fixture_result.data) {
    return create_failure_result(
      fixture_result.success
        ? MATCH_REPORT_PAGE_LOAD_MESSAGE.fixture_not_found
        : fixture_result.error ||
            MATCH_REPORT_PAGE_LOAD_MESSAGE.fixture_not_found,
    );
  }

  const fixture = fixture_result.data;
  const [
    home_team_result,
    away_team_result,
    lineups,
    competition_bundle,
    venue_result,
    assigned_officials_data,
  ] = await Promise.all([
    command.dependencies.team_use_cases.get_by_id(fixture.home_team_id),
    command.dependencies.team_use_cases.get_by_id(fixture.away_team_id),
    load_match_report_lineups(fixture, command.dependencies),
    load_match_report_competition_bundle(fixture, command.dependencies),
    fixture.venue
      ? command.dependencies.venue_use_cases.get_by_id(fixture.venue)
      : Promise.resolve(create_success_result(null as Venue | null)),
    load_match_report_assigned_officials(fixture, command.dependencies),
  ]);

  return create_success_result({
    fixture,
    home_team: home_team_result.success ? home_team_result.data : null,
    away_team: away_team_result.success ? away_team_result.data : null,
    competition: competition_bundle.competition,
    sport: competition_bundle.sport,
    venue: venue_result.success ? venue_result.data : null,
    organization_name: competition_bundle.organization_name,
    assigned_officials_data,
    home_players: lineups.home_players,
    away_players: lineups.away_players,
  });
}

export async function refresh_match_report_fixture_data(command: {
  fixture_id: string;
  dependencies: MatchReportRefreshDependencies;
}): AsyncResult<MatchReportRefreshData> {
  const fixture_result = await command.dependencies.fixture_use_cases.get_by_id(
    command.fixture_id,
  );
  if (!fixture_result.success || !fixture_result.data) {
    return create_failure_result(
      fixture_result.success
        ? MATCH_REPORT_PAGE_LOAD_MESSAGE.fixture_not_found
        : fixture_result.error ||
            MATCH_REPORT_PAGE_LOAD_MESSAGE.fixture_not_found,
    );
  }

  const lineups = await load_match_report_lineups(
    fixture_result.data,
    command.dependencies,
  );

  return create_success_result({
    fixture: fixture_result.data,
    home_players: lineups.home_players,
    away_players: lineups.away_players,
  });
}
