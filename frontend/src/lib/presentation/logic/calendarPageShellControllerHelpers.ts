import type { Activity } from "$lib/core/entities/Activity";
import type { Organization } from "$lib/core/entities/Organization";
import {
  ANY_VALUE,
  get_scope_value,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";
import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
import type { CalendarProfileState } from "$lib/presentation/logic/calendarPageData";

import {
  type ActivityFormValues,
  create_activity_form_values_from_activity,
  create_empty_activity_form_values,
} from "./calendarPageState";

export type LoadingState = "idle" | "loading" | "success" | "error";

export function extract_url_org_id(search_params: URLSearchParams): string {
  return search_params.get("org") ?? "";
}

export function can_user_add_activities(
  profile_state: CalendarProfileState,
): boolean {
  if (profile_state.status !== "present") return false;
  const profile: UserScopeProfile = profile_state.profile;
  if (profile.organization_id === ANY_VALUE) return true;
  return (
    !!get_scope_value(profile, "organization_id") &&
    !get_scope_value(profile, "team_id")
  );
}

export function can_user_change_organizations(
  profile_state: CalendarProfileState,
  url_org_id: string,
): boolean {
  if (profile_state.status !== "present") return url_org_id.length === 0;
  const profile: UserScopeProfile = profile_state.profile;
  if (profile.organization_id === ANY_VALUE) return true;
  return !profile.organization_id && url_org_id.length === 0;
}

export function resolve_selected_organization_name(
  organizations: Organization[],
  selected_organization_id: string,
): string {
  return (
    organizations.find(
      (organization: Organization) =>
        organization.id === selected_organization_id,
    )?.name || "Organization"
  );
}

export function create_activity_form_values_for_date(
  date_string: string,
): ActivityFormValues {
  return {
    ...create_empty_activity_form_values(),
    start_date: date_string,
    end_date: date_string,
  };
}

export function create_activity_form_values_for_date_time(
  date_string: string,
  time_string: string,
): ActivityFormValues {
  const start_hour = Number(time_string.split(":")[0]);
  return {
    ...create_empty_activity_form_values(),
    start_date: date_string,
    end_date: date_string,
    start_time: time_string,
    end_time: `${String((start_hour + 1) % 24).padStart(2, "0")}:${time_string.split(":")[1]}`,
  };
}

export function resolve_calendar_event_click(command: {
  calendar_events: CalendarEvent[];
  event_id: string;
}): {
  editing_activity?: Activity;
  selected_event_details?: CalendarEvent;
  activity_form_values?: ActivityFormValues;
  show_create_modal: boolean;
} {
  const selected_event = command.calendar_events.find(
    (calendar_event: CalendarEvent) => calendar_event.id === command.event_id,
  );
  if (!selected_event) {
    return {
      show_create_modal: false,
    };
  }
  if (!selected_event.is_editable) {
    return {
      selected_event_details: selected_event,
      show_create_modal: false,
    };
  }
  return {
    editing_activity: selected_event.activity,
    selected_event_details: void 0,
    activity_form_values: create_activity_form_values_from_activity(
      selected_event.activity,
    ),
    show_create_modal: true,
  };
}
