import {
  close_calendar_shell_create_modal,
  handle_calendar_shell_date_click,
  handle_calendar_shell_date_time_click,
  handle_calendar_shell_event_click,
} from "./calendarPageShellControllerRuntimeActivityModals";
import {
  can_create_calendar_category,
  create_calendar_shell_category_from_modal,
  delete_calendar_shell_current_activity,
  save_calendar_shell_current_activity,
} from "./calendarPageShellControllerRuntimeActivityPersistence";
import type {
  CalendarShellActivityActions,
  CalendarShellActivityContext,
} from "./calendarPageShellControllerRuntimeActivityTypes";

function get_today_date_string(): string {
  return new Date().toISOString().split("T")[0];
}

export function create_calendar_page_shell_controller_activity_actions(
  command: CalendarShellActivityContext,
): CalendarShellActivityActions {
  return {
    close_create_modal: () => close_calendar_shell_create_modal(command),
    close_event_details_modal: () => command.set_selected_event_details(),
    close_subscribe_modal: () => command.set_show_subscribe_modal(false),
    delete_current_activity: () =>
      delete_calendar_shell_current_activity(command),
    handle_create_category: (
      category_name: string,
      category_color: string,
      category_type: string,
    ) =>
      create_calendar_shell_category_from_modal(
        command,
        category_name,
        category_color,
        category_type,
      ),
    handle_date_click: (date_string: string = get_today_date_string()) =>
      handle_calendar_shell_date_click(command, date_string),
    handle_date_time_click: (date_string: string, time_string: string) =>
      handle_calendar_shell_date_time_click(command, date_string, time_string),
    handle_event_click: (event_id: string) =>
      handle_calendar_shell_event_click(command, event_id),
    handle_save_activity: () => save_calendar_shell_current_activity(command),
    open_category_modal: () => {
      if (can_create_calendar_category(command))
        command.set_show_category_modal(true);
    },
    open_subscribe_modal: () => command.set_show_subscribe_modal(true),
  };
}
