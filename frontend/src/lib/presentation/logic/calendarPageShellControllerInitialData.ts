import type { Organization } from "$lib/core/entities/Organization";
import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";

import { ensure_auth_profile } from "./authGuard";
import {
  load_calendar_organization_bundle,
  load_calendar_organizations,
} from "./calendarPageData";
import type {
  CalendarShellInitialDataCommand,
  CalendarShellInitialDataResult,
} from "./calendarPageShellControllerTypes";

export async function load_calendar_shell_initial_data(
  command: CalendarShellInitialDataCommand,
): Promise<CalendarShellInitialDataResult> {
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success && !command.is_public) {
    return { success: false, error_message: auth_result.error_message };
  }
  const fetch_result = await fetch_public_data_from_convex("calendar");
  const organizations = await load_calendar_organizations({
    current_profile_state: command.current_profile_state,
    organization_use_cases: command.use_cases.organization_use_cases,
  });
  if (organizations.length === 0) {
    return {
      success: true,
      is_using_cached_data: !fetch_result.success,
      organizations,
      selected_organization_id: "",
      bundle: void 0,
    };
  }
  const selected_organization_id = resolve_selected_organization_id(
    organizations,
    command.preferred_organization_id,
  );
  return {
    success: true,
    is_using_cached_data: !fetch_result.success,
    organizations,
    selected_organization_id,
    bundle: await load_calendar_organization_bundle({
      organization_id: selected_organization_id,
      filter_category_id: "",
      filter_competition_id: "",
      filter_team_id: "",
      use_cases: command.use_cases,
    }),
  };
}

function resolve_selected_organization_id(
  organizations: Organization[],
  preferred_organization_id: string,
): string {
  return (
    organizations.find(
      (organization: Organization) =>
        organization.id === preferred_organization_id,
    )?.id || organizations[0].id
  );
}
