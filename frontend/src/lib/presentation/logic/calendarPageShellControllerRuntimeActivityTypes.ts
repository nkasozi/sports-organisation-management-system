import type { Activity } from "$lib/core/entities/Activity";
import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import type { Competition } from "$lib/core/entities/Competition";
import type { Team } from "$lib/core/entities/Team";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
import type { UseCasesContainer } from "$lib/infrastructure/container";
import type { ActivityFormValues } from "$lib/presentation/logic/calendarPageState";

export type CalendarShellToastType = "success" | "error" | "warning" | "info";

export interface CalendarShellActivityContext {
  get_activity_form_values: () => ActivityFormValues;
  get_can_user_add_activities: () => boolean;
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
  show_toast: (message: string, type: CalendarShellToastType) => void;
  use_cases: UseCasesContainer;
}

export interface CalendarShellActivityActions {
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
}

interface CalendarShellFilterScope {
  selected_organization_id: string;
  filter_category_id: string;
  filter_competition_id: string;
  filter_team_id: string;
  use_cases: UseCasesContainer;
}

export function build_calendar_shell_filter_scope(
  context: CalendarShellActivityContext,
): CalendarShellFilterScope {
  return {
    selected_organization_id: context.get_selected_organization_id(),
    filter_category_id: context.get_filter_category_id(),
    filter_competition_id: context.get_filter_competition_id(),
    filter_team_id: context.get_filter_team_id(),
    use_cases: context.use_cases,
  };
}
