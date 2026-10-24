import { CALENDAR_PERMISSION_DENIED_MESSAGES } from "$lib/presentation/logic/calendarActivityPermissions";
import {
  create_calendar_shell_category,
  delete_calendar_shell_activity,
  save_calendar_shell_activity,
} from "$lib/presentation/logic/calendarPageShellControllerData";

import {
  can_save_current_calendar_activity,
  close_calendar_shell_create_modal,
  is_calendar_action_permitted,
} from "./calendarPageShellControllerRuntimeActivityModals";
import {
  build_calendar_shell_filter_scope,
  type CalendarShellActivityContext,
} from "./calendarPageShellControllerRuntimeActivityTypes";

export async function delete_calendar_shell_current_activity(
  context: CalendarShellActivityContext,
): Promise<boolean> {
  const editing_activity = context.get_editing_activity();
  if (!editing_activity) {
    return false;
  }
  if (
    !is_calendar_action_permitted(
      context,
      context.get_calendar_activity_permissions().can_delete_activity,
      CALENDAR_PERMISSION_DENIED_MESSAGES.DELETE_ACTIVITY,
    )
  ) {
    return false;
  }
  const result = await delete_calendar_shell_activity({
    editing_activity,
    ...build_calendar_shell_filter_scope(context),
  });
  if (!result.success) {
    context.show_toast(result.error_message, result.error_type);
    return false;
  }
  close_calendar_shell_create_modal(context);
  context.set_calendar_events(result.calendar_events);
  return true;
}

export function can_create_calendar_category(
  context: CalendarShellActivityContext,
): boolean {
  return is_calendar_action_permitted(
    context,
    context.get_calendar_activity_permissions().can_create_category,
    CALENDAR_PERMISSION_DENIED_MESSAGES.CREATE_CATEGORY,
  );
}

export async function create_calendar_shell_category_from_modal(
  context: CalendarShellActivityContext,
  category_name: string,
  category_color: string,
  category_type: string,
): Promise<void> {
  if (!can_create_calendar_category(context)) return;
  const result = await create_calendar_shell_category({
    category_name,
    category_color,
    category_type,
    ...build_calendar_shell_filter_scope(context),
  });
  if (!result.success) {
    context.show_toast(result.error_message, result.error_type);
    return;
  }
  context.set_categories(result.categories);
  context.set_show_category_modal(false);
}

export async function save_calendar_shell_current_activity(
  context: CalendarShellActivityContext,
): Promise<void> {
  if (!can_save_current_calendar_activity(context)) {
    return;
  }

  const result = await save_calendar_shell_activity({
    activity_form_values: context.get_activity_form_values(),
    categories: context.get_categories(),
    editing_activity: context.get_editing_activity(),
    ...build_calendar_shell_filter_scope(context),
  });
  if (!result.success) {
    context.show_toast(result.error_message, result.error_type);
    return;
  }
  close_calendar_shell_create_modal(context);
  context.set_calendar_events(result.calendar_events);
}
