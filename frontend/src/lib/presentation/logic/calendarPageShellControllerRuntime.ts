import { can_user_add_activities } from "$lib/presentation/logic/calendarPageShellControllerHelpers";

import { create_calendar_page_shell_controller_activity_actions } from "./calendarPageShellControllerRuntimeActivity";
import {
  clear_calendar_shell_filters,
  handle_calendar_shell_filter_change,
  handle_calendar_shell_organization_change,
  initialize_calendar_shell,
} from "./calendarPageShellControllerRuntimeLoading";
import type {
  CalendarPageShellRuntime,
  CalendarPageShellRuntimeContext,
} from "./calendarPageShellControllerRuntimeTypes";

export function create_calendar_page_shell_controller_runtime(
  command: CalendarPageShellRuntimeContext,
): CalendarPageShellRuntime {
  const activity_actions =
    create_calendar_page_shell_controller_activity_actions({
      ...command,
      get_can_user_add_activities: (): boolean =>
        can_user_add_activities(command.get_current_auth_profile_state()),
    });
  return {
    clear_filters: () => clear_calendar_shell_filters(command),
    handle_filter_change: () => handle_calendar_shell_filter_change(command),
    handle_organization_change: () =>
      handle_calendar_shell_organization_change(command),
    initialize: () => initialize_calendar_shell(command),
    ...activity_actions,
  };
}
