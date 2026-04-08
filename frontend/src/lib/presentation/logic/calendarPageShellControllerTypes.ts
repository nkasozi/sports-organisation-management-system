import type { Activity } from "$lib/core/entities/Activity";
import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { Competition } from "$lib/core/entities/Competition";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type {
  CalendarEvent,
  UserScopeProfile,
} from "$lib/core/interfaces/ports";
import type { UseCasesContainer } from "$lib/infrastructure/container";

export interface CalendarOrganizationBundle {
  teams: Team[];
  competitions: Competition[];
  categories: ActivityCategory[];
  calendar_events: CalendarEvent[];
}

export type CalendarShellFailure = {
  success: false;
  error_message: string;
  error_type: "success" | "error" | "warning" | "info";
};

export type CalendarShellScopedCommand = {
  selected_organization_id: string;
  filter_category_id: string;
  filter_competition_id: string;
  filter_team_id: string;
  use_cases: UseCasesContainer;
};

export type CalendarShellLoadCommand = {
  organization_id: string;
  filter_category_id: string;
  filter_competition_id: string;
  filter_team_id: string;
  use_cases: UseCasesContainer;
};

export type CalendarShellInitialDataCommand = {
  is_public: boolean;
  current_profile: UserScopeProfile | null;
  preferred_organization_id: string;
  use_cases: UseCasesContainer;
};

export type CalendarShellInitialDataResult =
  | { success: false; error_message: string }
  | {
      success: true;
      is_using_cached_data: boolean;
      organizations: Organization[];
      selected_organization_id: string;
      bundle: CalendarOrganizationBundle | null;
    };

export type SaveCalendarShellActivityCommand = {
  activity_form_values: ActivityFormValues;
  categories: ActivityCategory[];
  editing_activity: Activity | null;
} & CalendarShellScopedCommand;

export type DeleteCalendarShellActivityCommand = {
  editing_activity: Activity;
} & CalendarShellScopedCommand;

export type CreateCalendarShellCategoryCommand = {
  category_name: string;
  category_color: string;
  category_type: string;
} & CalendarShellScopedCommand;

import type { ActivityFormValues } from "./calendarPageState";

export function build_calendar_shell_load_command(
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
