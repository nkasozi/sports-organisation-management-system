import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";

import {
  create_calendar_category_action,
  delete_calendar_activity_action,
  save_calendar_activity_action,
} from "./calendarPageActions";
import {
  load_calendar_organization_bundle,
  sync_and_load_calendar_events,
} from "./calendarPageData";
import type {
  CalendarOrganizationBundle,
  CalendarShellFailure,
  CalendarShellLoadCommand,
  CreateCalendarShellCategoryCommand,
  DeleteCalendarShellActivityCommand,
  SaveCalendarShellActivityCommand,
} from "./calendarPageShellControllerTypes";
import { build_calendar_shell_load_command } from "./calendarPageShellControllerTypes";

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
  command: SaveCalendarShellActivityCommand,
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
  command: DeleteCalendarShellActivityCommand,
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
  command: CreateCalendarShellCategoryCommand,
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
