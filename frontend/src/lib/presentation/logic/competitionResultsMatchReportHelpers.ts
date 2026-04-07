import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Official } from "$lib/core/entities/Official";
import {
  get_team_staff_full_name,
  type TeamStaff,
} from "$lib/core/entities/TeamStaff";
import type { TeamStaffRole } from "$lib/core/entities/TeamStaffRole";
import type { FixtureLineupUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureLineupUseCasesPort";
import type { OfficialUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/OfficialUseCasesPort";
import type { OrganizationUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/OrganizationUseCasesPort";
import type { TeamStaffUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/TeamStaffUseCasesPort";
import type { MatchStaffEntry } from "$lib/core/types/MatchReportTypes";

export const COMPETITION_RESULTS_MATCH_REPORT_TEXT = {
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

export async function build_staff_entries(
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

export async function resolve_match_report_organization_name(
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

export async function build_staff_roles_map(
  dependencies: CompetitionResultsMatchReportDependencies,
): Promise<Map<string, string>> {
  const staff_roles_result =
    await dependencies.team_staff_use_cases.list_staff_roles();
  return new Map(
    (staff_roles_result.success && staff_roles_result.data
      ? staff_roles_result.data
      : []
    ).map((role: TeamStaffRole) => [role.id, role.name]),
  );
}

export async function build_assigned_officials(
  fixture: Fixture,
  dependencies: CompetitionResultsMatchReportDependencies,
): Promise<Array<{ official: Official; role_name: string }>> {
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
  return assigned_officials;
}
