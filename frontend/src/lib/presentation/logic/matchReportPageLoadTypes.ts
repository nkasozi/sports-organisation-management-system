import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";
import type { AsyncResult } from "$lib/core/types/Result";

export interface MatchReportAssignedOfficialData {
  official: Official;
  role_name: string;
}

export type MatchReportTeamState =
  | { status: "missing" }
  | { status: "present"; team: Team };

export type MatchReportCompetitionState =
  | { status: "missing" }
  | { status: "present"; competition: Competition };

export type MatchReportSportState =
  | { status: "missing" }
  | { status: "present"; sport: Sport };

export type MatchReportVenueState =
  | { status: "missing" }
  | { status: "present"; venue: Venue };

export interface MatchReportPageData {
  fixture: Fixture;
  home_team_state: MatchReportTeamState;
  away_team_state: MatchReportTeamState;
  competition_state: MatchReportCompetitionState;
  sport_state: MatchReportSportState;
  venue_state: MatchReportVenueState;
  organization_name: string;
  assigned_officials_data: MatchReportAssignedOfficialData[];
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
}

export type MatchReportPageDataState =
  | { status: "missing" }
  | { status: "present"; page_data: MatchReportPageData };

export interface MatchReportRefreshData {
  fixture: Fixture;
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
}

export interface MatchReportLineupResult {
  selected_players: LineupPlayer[];
}

export interface MatchReportOrganizationResult {
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
