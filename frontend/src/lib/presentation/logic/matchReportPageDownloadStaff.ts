import type { Fixture } from "$lib/core/entities/Fixture";
import type { TeamStaff } from "$lib/core/entities/TeamStaff";
import { get_team_staff_full_name } from "$lib/core/entities/TeamStaff";
import type { TeamStaffRole } from "$lib/core/entities/TeamStaffRole";
import type { MatchStaffEntry } from "$lib/core/types/MatchReportTypes";
import type { AsyncResult, PaginatedResult } from "$lib/core/types/Result";

import {
  MATCH_REPORT_EVENT,
  MATCH_REPORT_MESSAGE,
} from "./matchReportPageMessages";

export interface MatchReportPageDownloadDependencies {
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

export interface MatchReportTeamStaff {
  home_staff: MatchStaffEntry[];
  away_staff: MatchStaffEntry[];
}

async function load_match_report_staff_entries(
  team_id: string,
  staff_role_name_by_id: Map<string, string>,
  dependencies: MatchReportPageDownloadDependencies,
): Promise<MatchStaffEntry[]> {
  const staff_result =
    await dependencies.team_staff_use_cases.list_staff_by_team(team_id);
  if (!staff_result.success || !staff_result.data) {
    console.warn("[MatchReport] Team staff unavailable", {
      event: MATCH_REPORT_EVENT.TEAM_STAFF_UNAVAILABLE,
      team_id,
    });
    return [];
  }

  return staff_result.data.items.map((current_staff: TeamStaff) => ({
    role:
      staff_role_name_by_id.get(current_staff.role_id) ||
      MATCH_REPORT_MESSAGE.FALLBACK_STAFF_ROLE,
    name: get_team_staff_full_name(current_staff),
  }));
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

export async function load_match_report_team_staff(
  fixture: Fixture,
  dependencies: MatchReportPageDownloadDependencies,
): Promise<MatchReportTeamStaff> {
  const staff_roles_result =
    await dependencies.team_staff_use_cases.list_staff_roles();
  if (!staff_roles_result.success)
    console.warn("[MatchReport] Staff roles unavailable", {
      event: MATCH_REPORT_EVENT.STAFF_ROLES_UNAVAILABLE,
      fixture_id: fixture.id,
    });
  const staff_role_name_by_id = build_match_staff_role_name_by_id(
    staff_roles_result.success && staff_roles_result.data
      ? staff_roles_result.data
      : [],
  );
  const [home_staff, away_staff] = await Promise.all([
    load_match_report_staff_entries(
      fixture.home_team_id,
      staff_role_name_by_id,
      dependencies,
    ),
    load_match_report_staff_entries(
      fixture.away_team_id,
      staff_role_name_by_id,
      dependencies,
    ),
  ]);
  return { home_staff, away_staff };
}
