import { type Mock, vi } from "vitest";

import type { CalendarActivityPermissions } from "./calendarActivityPermissions";

type CalendarShellTestState = {
  organizations: { id: string; name: string }[];
  selected_organization_id: string;
};

function create_calendar_shell_getters(state: CalendarShellTestState): {
  get_activity_form_values: () => never;
  get_calendar_activity_permissions: () => CalendarActivityPermissions;
  get_calendar_events: () => never;
  get_categories: () => never;
  get_current_auth_profile_state: () => never;
  get_editing_activity: () => void;
  get_filter_category_id: () => string;
  get_filter_competition_id: () => string;
  get_filter_team_id: () => string;
  get_organizations: () => never;
  get_selected_organization_id: () => string;
  get_selected_organization_name: () => string;
  get_url_org_id: () => string;
} {
  return {
    get_activity_form_values: () => ({ title: "Training" }) as never,
    get_calendar_activity_permissions: () => ({
      can_create_activity: true,
      can_edit_activity: true,
      can_delete_activity: true,
      can_create_category: true,
    }),
    get_calendar_events: () => [{ id: "event-1" }] as never,
    get_categories: () => [{ id: "category-1" }] as never,
    get_current_auth_profile_state: () =>
      ({
        status: "present",
        profile: { organization_id: "organization-1" },
      }) as never,
    get_editing_activity: () => {},
    get_filter_category_id: () => "category-1",
    get_filter_competition_id: () => "competition-1",
    get_filter_team_id: () => "team-1",
    get_organizations: () => state.organizations as never,
    get_selected_organization_id: () => state.selected_organization_id,
    get_selected_organization_name: () => "Org One",
    get_url_org_id: () => "",
  };
}

function create_calendar_shell_setters(state: CalendarShellTestState): {
  set_activity_form_values: Mock;
  set_calendar_events: Mock;
  set_categories: Mock;
  set_competitions: Mock;
  set_editing_activity: Mock;
  set_error_message: Mock;
  set_filter_category_id: Mock;
  set_filter_competition_id: Mock;
  set_filter_loading: Mock;
  set_filter_team_id: Mock;
  set_is_using_cached_data: Mock;
  set_loading_state: Mock;
  set_organizations: Mock;
  set_selected_event_details: Mock;
  set_selected_organization_id: Mock;
  set_show_category_modal: Mock;
  set_show_create_modal: Mock;
  set_show_subscribe_modal: Mock;
  set_teams: Mock;
} {
  return {
    set_activity_form_values: vi.fn(),
    set_calendar_events: vi.fn(),
    set_categories: vi.fn(),
    set_competitions: vi.fn(),
    set_editing_activity: vi.fn(),
    set_error_message: vi.fn(),
    set_filter_category_id: vi.fn(),
    set_filter_competition_id: vi.fn(),
    set_filter_loading: vi.fn(),
    set_filter_team_id: vi.fn(),
    set_is_using_cached_data: vi.fn(),
    set_loading_state: vi.fn(),
    set_organizations: vi.fn((value: unknown[]) => {
      state.organizations = value as never;
    }),
    set_selected_event_details: vi.fn(),
    set_selected_organization_id: vi.fn((value: string) => {
      state.selected_organization_id = value;
    }),
    set_show_category_modal: vi.fn(),
    set_show_create_modal: vi.fn(),
    set_show_subscribe_modal: vi.fn(),
    set_teams: vi.fn(),
  };
}

type CalendarShellTestCommand = ReturnType<
  typeof create_calendar_shell_getters
> &
  ReturnType<typeof create_calendar_shell_setters> & {
    show_toast: Mock;
    use_cases: never;
  };

export function create_calendar_shell_command(): {
  command: CalendarShellTestCommand;
  state: CalendarShellTestState;
} {
  const state: CalendarShellTestState = {
    organizations: [{ id: "organization-1", name: "Org One" }],
    selected_organization_id: "organization-1",
  };

  const command = {
    ...create_calendar_shell_getters(state),
    ...create_calendar_shell_setters(state),
    show_toast: vi.fn(),
    use_cases: {} as never,
  };

  return { command, state };
}
