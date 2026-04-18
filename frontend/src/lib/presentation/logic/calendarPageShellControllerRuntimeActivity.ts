import type { Activity } from "$lib/core/entities/Activity";
import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
import type { UseCasesContainer } from "$lib/infrastructure/container";
import {
  create_calendar_shell_category,
  delete_calendar_shell_activity,
  save_calendar_shell_activity,
} from "$lib/presentation/logic/calendarPageShellControllerData";
import {
  create_activity_form_values_for_date,
  create_activity_form_values_for_date_time,
  resolve_calendar_event_click,
} from "$lib/presentation/logic/calendarPageShellControllerHelpers";
import {
  type ActivityFormValues,
  create_empty_activity_form_values,
} from "$lib/presentation/logic/calendarPageState";

export function create_calendar_page_shell_controller_activity_actions(command: {
  get_activity_form_values: () => ActivityFormValues;
  get_calendar_events: () => CalendarEvent[];
  get_categories: () => ActivityCategory[];
  get_editing_activity: () => Activity | undefined;
  get_filter_category_id: () => string;
  get_filter_competition_id: () => string;
  get_filter_team_id: () => string;
  get_selected_organization_id: () => string;
  set_activity_form_values: (value: ActivityFormValues) => void;
  set_calendar_events: (value: CalendarEvent[]) => void;
  set_categories: (value: ActivityCategory[]) => void;
  set_competitions: (value: Competition[]) => void;
  set_editing_activity: (value?: Activity) => void;
  set_selected_event_details: (value?: CalendarEvent) => void;
  set_show_category_modal: (value: boolean) => void;
  set_show_create_modal: (value: boolean) => void;
  set_show_subscribe_modal: (value: boolean) => void;
  set_teams: (value: Team[]) => void;
  show_toast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
  use_cases: UseCasesContainer;
}): {
  close_create_modal: () => void;
  close_event_details_modal: () => void;
  close_subscribe_modal: () => void;
  delete_current_activity: () => Promise<boolean>;
  handle_create_category: (
    category_name: string,
    category_color: string,
    category_type: string,
  ) => Promise<void>;
  handle_date_click: (date_string?: string) => void;
  handle_date_time_click: (date_string: string, time_string: string) => void;
  handle_event_click: (event_id: string) => void;
  handle_save_activity: () => Promise<void>;
  open_category_modal: () => void;
  open_subscribe_modal: () => void;
} {
  const close_create_modal = (): void => {
    command.set_show_create_modal(false);
    command.set_editing_activity();
    command.set_activity_form_values(create_empty_activity_form_values());
  };
  return {
    close_create_modal,
    close_event_details_modal: () => command.set_selected_event_details(),
    close_subscribe_modal: () => command.set_show_subscribe_modal(false),
    delete_current_activity: async (): Promise<boolean> => {
      const editing_activity = command.get_editing_activity();
      if (!editing_activity) {
        return false;
      }
      const result = await delete_calendar_shell_activity({
        editing_activity,
        selected_organization_id: command.get_selected_organization_id(),
        filter_category_id: command.get_filter_category_id(),
        filter_competition_id: command.get_filter_competition_id(),
        filter_team_id: command.get_filter_team_id(),
        use_cases: command.use_cases,
      });
      if (!result.success) {
        command.show_toast(result.error_message, result.error_type);
        return false;
      }
      close_create_modal();
      command.set_calendar_events(result.calendar_events);
      return true;
    },
    handle_create_category: async (
      category_name: string,
      category_color: string,
      category_type: string,
    ): Promise<void> => {
      const result = await create_calendar_shell_category({
        category_name,
        category_color,
        category_type,
        selected_organization_id: command.get_selected_organization_id(),
        filter_category_id: command.get_filter_category_id(),
        filter_competition_id: command.get_filter_competition_id(),
        filter_team_id: command.get_filter_team_id(),
        use_cases: command.use_cases,
      });
      if (!result.success) {
        command.show_toast(result.error_message, result.error_type);
        return;
      }
      command.set_categories(result.categories);
      command.set_show_category_modal(false);
    },
    handle_date_click: (
      date_string = new Date().toISOString().split("T")[0],
    ): void => {
      command.set_activity_form_values(
        create_activity_form_values_for_date(date_string),
      );
      command.set_editing_activity();
      command.set_show_create_modal(true);
    },
    handle_date_time_click: (
      date_string: string,
      time_string: string,
    ): void => {
      command.set_activity_form_values(
        create_activity_form_values_for_date_time(date_string, time_string),
      );
      command.set_editing_activity();
      command.set_show_create_modal(true);
    },
    handle_event_click: (event_id: string): void => {
      const event_selection = resolve_calendar_event_click({
        calendar_events: command.get_calendar_events(),
        event_id,
      });
      if (event_selection.activity_form_values) {
        command.set_editing_activity(event_selection.editing_activity);
        command.set_activity_form_values(event_selection.activity_form_values);
        command.set_show_create_modal(event_selection.show_create_modal);
        return;
      }
      command.set_selected_event_details(
        event_selection.selected_event_details,
      );
    },
    handle_save_activity: async (): Promise<void> => {
      const result = await save_calendar_shell_activity({
        activity_form_values: command.get_activity_form_values(),
        categories: command.get_categories(),
        editing_activity: command.get_editing_activity(),
        selected_organization_id: command.get_selected_organization_id(),
        filter_category_id: command.get_filter_category_id(),
        filter_competition_id: command.get_filter_competition_id(),
        filter_team_id: command.get_filter_team_id(),
        use_cases: command.use_cases,
      });
      if (!result.success) {
        command.show_toast(result.error_message, result.error_type);
        return;
      }
      close_create_modal();
      command.set_calendar_events(result.calendar_events);
    },
    open_category_modal: () => command.set_show_category_modal(true),
    open_subscribe_modal: () => command.set_show_subscribe_modal(true),
  };
}
