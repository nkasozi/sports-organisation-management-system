import type { Activity } from "$lib/core/entities/Activity";
import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
import type { UseCasesContainer } from "$lib/infrastructure/container";
import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";

import { ensure_auth_profile } from "./authGuard";
import {
  create_calendar_category_action,
  delete_calendar_activity_action,
  save_calendar_activity_action,
} from "./calendarPageActions";
import {
  load_calendar_organization_bundle,
  load_calendar_organizations,
  sync_and_load_calendar_events,
} from "./calendarPageData";
import type { ActivityFormValues } from "./calendarPageState";

interface CalendarOrganizationBundle {
  teams: Team[];
  competitions: Competition[];
  categories: ActivityCategory[];
  calendar_events: CalendarEvent[];
}

type CalendarShellFailure = {
  success: false;
  error_message: string;
  error_type: "success" | "error" | "warning" | "info";
};

type CalendarShellScopedCommand = {
  selected_organization_id: string;
  filter_category_id: string;
  filter_competition_id: string;
  filter_team_id: string;
  use_cases: UseCasesContainer;
};

type CalendarShellLoadCommand = {
  organization_id: string;
  filter_category_id: string;
  filter_competition_id: string;
  filter_team_id: string;
  use_cases: UseCasesContainer;
};

function build_calendar_shell_load_command(
  command: CalendarShellScopedCommand,
): CalendarShellLoadCommand {
  return {
    organization_id: command.selected_organization_id,
    filter_category_id: command.filter_category_id,
    filter_competition_id: command.filter_competition_id,
    filter_team_id: command.filter_team_id,
    use_cases: command.use_cases,
  };
}

export async function load_calendar_shell_bundle(
  command: CalendarShellLoadCommand,
): Promise<CalendarOrganizationBundle> {
  return load_calendar_organization_bundle(command);
}

export async function load_calendar_shell_events(
  command: CalendarShellLoadCommand,
): Promise<CalendarEvent[]> {
  return sync_and_load_calendar_events({
    organization_id: command.organization_id,
    filter_category_id: command.filter_category_id,
    filter_competition_id: command.filter_competition_id,
    filter_team_id: command.filter_team_id,
    activity_use_cases: command.use_cases.activity_use_cases,
  });
}

export async function save_calendar_shell_activity(
  command: {
    activity_form_values: ActivityFormValues;
    categories: ActivityCategory[];
    editing_activity: Activity | null;
  } & CalendarShellScopedCommand,
): Promise<
  { success: true; calendar_events: CalendarEvent[] } | CalendarShellFailure
> {
  const result = await save_calendar_activity_action({
    activity_form_values: command.activity_form_values,
    categories: command.categories,
    editing_activity: command.editing_activity,
    selected_organization_id: command.selected_organization_id,
    activity_use_cases: command.use_cases.activity_use_cases,
  });
  if (!result.success) {
    return {
      success: false,
      error_message: result.error_message,
      error_type: result.error_type,
    };
  }
  return {
    success: true,
    calendar_events: await load_calendar_shell_events(
      build_calendar_shell_load_command(command),
    ),
  };
}

export async function delete_calendar_shell_activity(
  command: {
    editing_activity: Activity;
  } & CalendarShellScopedCommand,
): Promise<
  { success: true; calendar_events: CalendarEvent[] } | CalendarShellFailure
> {
  const result = await delete_calendar_activity_action({
    editing_activity: command.editing_activity,
    activity_use_cases: command.use_cases.activity_use_cases,
  });
  if (!result.success) {
    return {
      success: false,
      error_message: result.error_message,
      error_type: result.error_type,
    };
  }
  return {
    success: true,
    calendar_events: await load_calendar_shell_events(
      build_calendar_shell_load_command(command),
    ),
  };
}

export async function create_calendar_shell_category(
  command: {
    category_name: string;
    category_color: string;
    category_type: string;
  } & CalendarShellScopedCommand,
): Promise<
  { success: true; categories: ActivityCategory[] } | CalendarShellFailure
> {
  const result = await create_calendar_category_action({
    category_name: command.category_name,
    category_color: command.category_color,
    category_type: command.category_type,
    selected_organization_id: command.selected_organization_id,
    activity_category_use_cases: command.use_cases.activity_category_use_cases,
  });
  if (!result.success) {
    return {
      success: false,
      error_message: result.error_message,
      error_type: result.error_type,
    };
  }
  const bundle = await load_calendar_shell_bundle(
    build_calendar_shell_load_command(command),
  );
  return { success: true, categories: bundle.categories };
}

export async function load_calendar_shell_initial_data(command: {
  is_public: boolean;
  current_profile: UserScopeProfile | null;
  preferred_organization_id: string;
  use_cases: UseCasesContainer;
}): Promise<
  | { success: false; error_message: string }
  | {
      success: true;
      is_using_cached_data: boolean;
      organizations: Organization[];
      selected_organization_id: string;
      bundle: CalendarOrganizationBundle | null;
    }
> {
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success && !command.is_public) {
    return { success: false, error_message: auth_result.error_message };
  }
  const fetch_result = await fetch_public_data_from_convex("calendar");
  const organizations = await load_calendar_organizations({
    current_profile: command.current_profile,
    organization_use_cases: command.use_cases.organization_use_cases,
  });
  if (organizations.length === 0) {
    return {
      success: true,
      is_using_cached_data: !fetch_result.success,
      organizations,
      selected_organization_id: "",
      bundle: null,
    };
  }
  const selected_organization_id =
    organizations.find(
      (organization: Organization) =>
        organization.id === command.preferred_organization_id,
    )?.id || organizations[0].id;
  return {
    success: true,
    is_using_cached_data: !fetch_result.success,
    organizations,
    selected_organization_id,
    bundle: await load_calendar_shell_bundle({
      organization_id: selected_organization_id,
      filter_category_id: "",
      filter_competition_id: "",
      filter_team_id: "",
      use_cases: command.use_cases,
    }),
  };
}
