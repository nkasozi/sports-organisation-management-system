import {
  create_activity_form_values_for_date,
  create_activity_form_values_for_date_time,
  resolve_calendar_event_click,
} from "$lib/presentation/logic/calendarPageShellControllerHelpers";
import {
  type ActivityFormValues,
  create_empty_activity_form_values,
} from "$lib/presentation/logic/calendarPageState";

import type { CalendarShellActivityContext } from "./calendarPageShellControllerRuntimeActivityTypes";

const CREATE_ACTIVITY_PERMISSION_DENIED_MESSAGE =
  "You do not have permission to create activities.";
const CREATE_ACTIVITY_PERMISSION_DENIED_TOAST_TYPE = "warning" as const;

export function close_calendar_shell_create_modal(
  context: CalendarShellActivityContext,
): void {
  context.set_show_create_modal(false);
  context.set_editing_activity();
  context.set_activity_form_values(create_empty_activity_form_values());
}

function show_create_activity_permission_denied_toast(
  context: CalendarShellActivityContext,
): void {
  context.show_toast(
    CREATE_ACTIVITY_PERMISSION_DENIED_MESSAGE,
    CREATE_ACTIVITY_PERMISSION_DENIED_TOAST_TYPE,
  );
}

function can_open_create_activity_modal(
  context: CalendarShellActivityContext,
): boolean {
  if (context.get_can_user_add_activities()) {
    return true;
  }

  show_create_activity_permission_denied_toast(context);

  return false;
}

export function can_save_current_calendar_activity(
  context: CalendarShellActivityContext,
): boolean {
  if (context.get_editing_activity()) {
    return true;
  }

  if (context.get_can_user_add_activities()) {
    return true;
  }

  show_create_activity_permission_denied_toast(context);

  return false;
}

function open_create_modal_with_form_values(
  context: CalendarShellActivityContext,
  activity_form_values: ActivityFormValues,
): void {
  context.set_activity_form_values(activity_form_values);
  context.set_editing_activity();
  context.set_show_create_modal(true);
}

export function handle_calendar_shell_date_click(
  context: CalendarShellActivityContext,
  date_string: string,
): void {
  if (!can_open_create_activity_modal(context)) {
    return;
  }

  open_create_modal_with_form_values(
    context,
    create_activity_form_values_for_date(date_string),
  );
}

export function handle_calendar_shell_date_time_click(
  context: CalendarShellActivityContext,
  date_string: string,
  time_string: string,
): void {
  if (!can_open_create_activity_modal(context)) {
    return;
  }

  open_create_modal_with_form_values(
    context,
    create_activity_form_values_for_date_time(date_string, time_string),
  );
}

export function handle_calendar_shell_event_click(
  context: CalendarShellActivityContext,
  event_id: string,
): void {
  const event_selection = resolve_calendar_event_click({
    calendar_events: context.get_calendar_events(),
    event_id,
  });
  if (event_selection.activity_form_values) {
    context.set_editing_activity(event_selection.editing_activity);
    context.set_activity_form_values(event_selection.activity_form_values);
    context.set_show_create_modal(event_selection.show_create_modal);
    return;
  }
  context.set_selected_event_details(event_selection.selected_event_details);
}
