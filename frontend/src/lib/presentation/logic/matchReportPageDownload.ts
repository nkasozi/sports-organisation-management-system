import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Team } from "$lib/core/entities/Team";
import type { TeamStaff } from "$lib/core/entities/TeamStaff";
import { get_team_staff_full_name } from "$lib/core/entities/TeamStaff";
import type { TeamStaffRole } from "$lib/core/entities/TeamStaffRole";
import type {
  CardTypeConfig,
  MatchStaffEntry,
} from "$lib/core/types/MatchReportTypes";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type PaginatedResult,
} from "$lib/core/types/Result";
import {
  build_match_report_data,
  generate_match_report_filename,
  type MatchReportBuildContext,
} from "$lib/infrastructure/utils/MatchReportBuilder";
import { download_match_report } from "$lib/infrastructure/utils/MatchReportPdfGenerator";

import type {
  MatchReportAssignedOfficialData,
  MatchReportCompetitionState,
  MatchReportSportState,
  MatchReportVenueState,
} from "./matchReportPageLoadTypes";

const MATCH_REPORT_DOWNLOAD_TEXT = {
  default_organization_name: "SPORT-SYNC",
  fallback_staff_role: "Staff",
  download_failed: "Failed to download match report",
  download_success: "Match report downloaded!",
} as const;

interface MatchReportPageDownloadDependencies {
  organization_use_cases: {
    get_by_id(id: string): AsyncResult<{ name: string }>;
  };
  team_staff_use_cases: {
    list_staff_roles(): AsyncResult<TeamStaffRole[]>;
    list_staff_by_team(
      team_id: string,
    ): AsyncResult<PaginatedResult<TeamStaff>>;
  };
}

async function load_match_report_staff_entries(
  team_id: string,
  staff_role_name_by_id: Map<string, string>,
  dependencies: MatchReportPageDownloadDependencies,
): Promise<MatchStaffEntry[]> {
  const staff_result =
    await dependencies.team_staff_use_cases.list_staff_by_team(team_id);
  if (!staff_result.success || !staff_result.data) {
    return [];
  }

  return staff_result.data.items.map((current_staff: TeamStaff) => ({
    role:
      staff_role_name_by_id.get(current_staff.role_id) ||
      MATCH_REPORT_DOWNLOAD_TEXT.fallback_staff_role,
    name: get_team_staff_full_name(current_staff),
  }));
}

function build_match_report_card_types(
  sport_state: MatchReportSportState,
): CardTypeConfig[] {
  if (sport_state.status === "missing") {
    return [];
  }

  return (
    sport_state.sport.card_types?.map((current_card_type) => ({
      id: current_card_type.id,
      name: current_card_type.name,
      color: current_card_type.color,
      event_type: `${current_card_type.id}_card`,
    })) || []
  );
}

async function load_match_report_organization_name(
  competition_state: MatchReportCompetitionState,
  dependencies: MatchReportPageDownloadDependencies,
): Promise<string> {
  if (
    competition_state.status === "missing" ||
    !competition_state.competition.organization_id
  ) {
    return MATCH_REPORT_DOWNLOAD_TEXT.default_organization_name;
  }

  const organization_result =
    await dependencies.organization_use_cases.get_by_id(
      competition_state.competition.organization_id,
    );
  if (!organization_result.success || !organization_result.data) {
    return MATCH_REPORT_DOWNLOAD_TEXT.default_organization_name;
  }

  return organization_result.data.name.toUpperCase();
}

function build_match_staff_role_name_by_id(
  staff_roles: TeamStaffRole[],
): Map<string, string> {
  return new Map(
    staff_roles.map((current_role: TeamStaffRole) => [
      current_role.id,
      current_role.name,
    ]),
  );
}

export async function download_match_report_for_fixture(command: {
  fixture: Fixture;
  home_team: Team;
  away_team: Team;
  competition_state: MatchReportCompetitionState;
  sport_state: MatchReportSportState;
  venue_state: MatchReportVenueState;
  assigned_officials_data: MatchReportAssignedOfficialData[];
  home_players: LineupPlayer[];
  away_players: LineupPlayer[];
  organization_logo_url: string;
  dependencies: MatchReportPageDownloadDependencies;
}): AsyncResult<string> {
  try {
    const organization_name = await load_match_report_organization_name(
      command.competition_state,
      command.dependencies,
    );
    const staff_roles_result =
      await command.dependencies.team_staff_use_cases.list_staff_roles();
    const staff_role_name_by_id = build_match_staff_role_name_by_id(
      staff_roles_result.success && staff_roles_result.data
        ? staff_roles_result.data
        : [],
    );
    const [home_staff, away_staff] = await Promise.all([
      load_match_report_staff_entries(
        command.fixture.home_team_id,
        staff_role_name_by_id,
        command.dependencies,
      ),
      load_match_report_staff_entries(
        command.fixture.away_team_id,
        staff_role_name_by_id,
        command.dependencies,
      ),
    ]);

    const report_context: MatchReportBuildContext = {
      fixture: command.fixture,
      home_team: command.home_team,
      away_team: command.away_team,
      competition:
        command.competition_state.status === "present"
          ? command.competition_state.competition
          : void 0,
      home_lineup: command.home_players,
      away_lineup: command.away_players,
      assigned_officials: command.assigned_officials_data,
      home_staff,
      away_staff,
      card_types: build_match_report_card_types(command.sport_state),
      organization_name,
      venue_name:
        command.venue_state.status === "present"
          ? command.venue_state.venue.name
          : void 0,
      organization_logo_url: command.organization_logo_url,
    };
    const report_data = build_match_report_data(report_context);
    const filename = generate_match_report_filename(
      command.home_team.name,
      command.away_team.name,
      command.fixture.scheduled_date,
    );

    download_match_report(report_data, filename);
    return create_success_result(MATCH_REPORT_DOWNLOAD_TEXT.download_success);
  } catch (error) {
    console.error("[MatchReport] Download failed", {
      event: "match_report_download_failed",
      fixture_id: command.fixture.id,
      error: String(error),
    });
    return create_failure_result(MATCH_REPORT_DOWNLOAD_TEXT.download_failed);
  }
}
