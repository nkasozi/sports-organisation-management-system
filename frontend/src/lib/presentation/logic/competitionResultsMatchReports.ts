import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Official } from "$lib/core/entities/Official";
import type { Team } from "$lib/core/entities/Team";
import {
  get_team_staff_full_name,
  type TeamStaff,
} from "$lib/core/entities/TeamStaff";
import type { TeamStaffRole } from "$lib/core/entities/TeamStaffRole";
import type { FixtureLineupUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureLineupUseCasesPort";
import type { OfficialUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/OfficialUseCasesPort";
import type { OrganizationUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/OrganizationUseCasesPort";
import type { TeamStaffUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/TeamStaffUseCasesPort";
import type {
  MatchReportData,
  MatchStaffEntry,
} from "$lib/core/types/MatchReportTypes";
import {
  build_match_report_data,
  generate_match_report_filename,
  type MatchReportBuildContext,
} from "$lib/infrastructure/utils/MatchReportBuilder";
import {
  download_all_match_reports,
  download_match_report,
} from "$lib/infrastructure/utils/MatchReportPdfGenerator";

const COMPETITION_RESULTS_MATCH_REPORT_TEXT = {
  default_organization_name: "SPORT-SYNC",
  fallback_staff_role: "Staff",
  all_reports_suffix: "_All_Match_Reports.pdf",
  default_competition_name: "Competition",
} as const;

export interface CompetitionResultsMatchReportDependencies {
  fixture_lineup_use_cases: Pick<
    FixtureLineupUseCasesPort,
    "get_lineup_for_team_in_fixture"
  >;
  official_use_cases: Pick<OfficialUseCasesPort, "get_by_id">;
  organization_use_cases: Pick<OrganizationUseCasesPort, "get_by_id">;
  team_staff_use_cases: Pick<
    TeamStaffUseCasesPort,
    "list_staff_roles" | "list_staff_by_team"
  >;
}

async function build_staff_entries(
  team_id: string,
  staff_roles_map: Map<string, string>,
  team_staff_use_cases: CompetitionResultsMatchReportDependencies["team_staff_use_cases"],
): Promise<MatchStaffEntry[]> {
  const staff_result = await team_staff_use_cases.list_staff_by_team(team_id);
  if (!staff_result.success || !staff_result.data) return [];
  return staff_result.data.items.map((staff: TeamStaff) => ({
    role:
      staff_roles_map.get(staff.role_id) ||
      COMPETITION_RESULTS_MATCH_REPORT_TEXT.fallback_staff_role,
    name: get_team_staff_full_name(staff),
  }));
}

async function resolve_match_report_organization_name(
  selected_competition: Competition | null,
  dependencies: CompetitionResultsMatchReportDependencies,
): Promise<string> {
  if (!selected_competition?.organization_id) {
    return COMPETITION_RESULTS_MATCH_REPORT_TEXT.default_organization_name;
  }

  const organization_result =
    await dependencies.organization_use_cases.get_by_id(
      selected_competition.organization_id,
    );
  if (!organization_result.success) {
    return COMPETITION_RESULTS_MATCH_REPORT_TEXT.default_organization_name;
  }

  return (
    organization_result.data.name ||
    COMPETITION_RESULTS_MATCH_REPORT_TEXT.default_organization_name
  ).toUpperCase();
}

export async function build_report_data_for_fixture(command: {
  fixture: Fixture;
  selected_competition: Competition | null;
  team_map: Map<string, Team>;
  organization_name: string;
  organization_logo_url: string;
  staff_roles_map: Map<string, string>;
  dependencies: CompetitionResultsMatchReportDependencies;
}): Promise<MatchReportData | null> {
  const {
    fixture,
    selected_competition,
    team_map,
    organization_name,
    organization_logo_url,
    staff_roles_map,
    dependencies,
  } = command;
  const home_team = team_map.get(fixture.home_team_id);
  const away_team = team_map.get(fixture.away_team_id);
  if (!home_team || !away_team) return null;

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
  const assigned_officials: Array<{ official: Official; role_name: string }> =
    [];
  for (const assignment of fixture.assigned_officials || []) {
    const official_result = await dependencies.official_use_cases.get_by_id(
      assignment.official_id,
    );
    if (official_result.success && official_result.data) {
      assigned_officials.push({
        official: official_result.data,
        role_name: assignment.role_name,
      });
    }
  }

  const context: MatchReportBuildContext = {
    fixture,
    home_team,
    away_team,
    competition: selected_competition,
    home_lineup:
      home_lineup_result.success && home_lineup_result.data
        ? home_lineup_result.data.selected_players
        : [],
    away_lineup:
      away_lineup_result.success && away_lineup_result.data
        ? away_lineup_result.data.selected_players
        : [],
    assigned_officials,
    home_staff,
    away_staff,
    organization_name,
    organization_logo_url,
  };

  return build_match_report_data(context);
}

export async function download_fixture_report(command: {
  fixture: Fixture;
  selected_competition: Competition | null;
  team_map: Map<string, Team>;
  organization_logo_url: string;
  dependencies: CompetitionResultsMatchReportDependencies;
}): Promise<boolean> {
  const {
    fixture,
    selected_competition,
    team_map,
    organization_logo_url,
    dependencies,
  } = command;
  const organization_name = await resolve_match_report_organization_name(
    selected_competition,
    dependencies,
  );
  const staff_roles_result =
    await dependencies.team_staff_use_cases.list_staff_roles();
  const staff_roles_map = new Map(
    (staff_roles_result.success && staff_roles_result.data
      ? staff_roles_result.data
      : []
    ).map((role: TeamStaffRole) => [role.id, role.name]),
  );
  const report_data = await build_report_data_for_fixture({
    fixture,
    selected_competition,
    team_map,
    organization_name,
    organization_logo_url,
    staff_roles_map,
    dependencies,
  });
  const home_team = team_map.get(fixture.home_team_id);
  const away_team = team_map.get(fixture.away_team_id);
  if (!report_data || !home_team || !away_team) return false;
  download_match_report(
    report_data,
    generate_match_report_filename(
      home_team.name,
      away_team.name,
      fixture.scheduled_date,
    ),
  );
  return true;
}

export async function download_all_fixture_reports(command: {
  completed_fixtures: Fixture[];
  selected_competition: Competition | null;
  team_map: Map<string, Team>;
  organization_logo_url: string;
  dependencies: CompetitionResultsMatchReportDependencies;
}): Promise<boolean> {
  const {
    completed_fixtures,
    selected_competition,
    team_map,
    organization_logo_url,
    dependencies,
  } = command;
  if (completed_fixtures.length === 0) return false;
  const organization_name = await resolve_match_report_organization_name(
    selected_competition,
    dependencies,
  );
  const staff_roles_result =
    await dependencies.team_staff_use_cases.list_staff_roles();
  const staff_roles_map = new Map(
    (staff_roles_result.success && staff_roles_result.data
      ? staff_roles_result.data
      : []
    ).map((role: TeamStaffRole) => [role.id, role.name]),
  );
  const report_data = await Promise.all(
    completed_fixtures.map((fixture: Fixture) =>
      build_report_data_for_fixture({
        fixture,
        selected_competition,
        team_map,
        organization_name,
        organization_logo_url,
        staff_roles_map,
        dependencies,
      }),
    ),
  );
  const valid_reports = report_data.filter(
    (item): item is MatchReportData => item !== null,
  );
  if (valid_reports.length === 0) return false;
  download_all_match_reports(
    valid_reports,
    `${selected_competition?.name || COMPETITION_RESULTS_MATCH_REPORT_TEXT.default_competition_name}${COMPETITION_RESULTS_MATCH_REPORT_TEXT.all_reports_suffix}`,
  );
  return true;
}
