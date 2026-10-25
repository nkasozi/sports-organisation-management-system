import type { Organization } from "$lib/core/entities/Organization";
import { type Option, OptionStatus } from "$lib/core/types/Option";
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
import { build_public_organization_scope } from "./publicDataOrganizationScope";

const CALENDAR_PUBLIC_DATA_PAGE = "calendar";

export async function load_calendar_shell_initial_data(
  command: CalendarShellInitialDataCommand,
): Promise<CalendarShellInitialDataResult> {
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success && !command.is_public) {
    return { success: false, error_message: auth_result.error_message };
  }
  const preferred_scope = build_public_organization_scope(
    command.preferred_organization_id,
  );
  const fetch_result = await fetch_public_data_from_convex(
    CALENDAR_PUBLIC_DATA_PAGE,
    preferred_scope,
  );
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
  return load_selected_calendar_organization(command, {
    organizations,
    preferred_scope,
    is_preferred_fetch_successful: fetch_result.success,
  });
}

async function load_selected_calendar_organization(
  command: CalendarShellInitialDataCommand,
  loaded: {
    organizations: Organization[];
    preferred_scope: Option<string>;
    is_preferred_fetch_successful: boolean;
  },
): Promise<CalendarShellInitialDataResult> {
  const selected_organization_id = await resolve_selected_organization_id(
    loaded.organizations,
    command.preferred_organization_id,
    command.use_cases.competition_use_cases,
  );
  const is_selection_fetched = await fetch_selected_organization_data(
    loaded.preferred_scope.status === OptionStatus.SOME &&
      loaded.preferred_scope.value === selected_organization_id,
    selected_organization_id,
  );
  return {
    success: true,
    is_using_cached_data:
      !loaded.is_preferred_fetch_successful || !is_selection_fetched,
    organizations: loaded.organizations,
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

async function fetch_selected_organization_data(
  is_already_fetched: boolean,
  selected_organization_id: string,
): Promise<boolean> {
  if (is_already_fetched) return true;
  const selected_fetch = await fetch_public_data_from_convex(
    CALENDAR_PUBLIC_DATA_PAGE,
    build_public_organization_scope(selected_organization_id),
  );
  return selected_fetch.success;
}

export async function resolve_selected_organization_id(
  organizations: Organization[],
  preferred_organization_id: string,
  competition_use_cases: CalendarShellInitialDataCommand["use_cases"]["competition_use_cases"],
): Promise<string> {
  const preferred = organizations.find(
    (organization: Organization) =>
      organization.id === preferred_organization_id,
  );
  if (preferred) return preferred.id;
  for (const organization of organizations) {
    const competitions_result = await competition_use_cases.list({
      organization_id: organization.id,
    });
    if (
      competitions_result.success &&
      competitions_result.data.items.length > 0
    )
      return organization.id;
  }
  return organizations[0].id;
}
