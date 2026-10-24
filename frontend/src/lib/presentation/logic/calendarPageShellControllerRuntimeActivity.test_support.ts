import { type Mock, vi } from "vitest";

import { type Option, OptionStatus } from "$lib/core/types/Option";

import type { CalendarActivityPermissions } from "./calendarActivityPermissions";

const FULL_CALENDAR_ACTIVITY_PERMISSIONS: CalendarActivityPermissions = {
  can_create_activity: true,
  can_edit_activity: true,
  can_delete_activity: true,
  can_create_category: true,
};

interface CalendarActivityCommandOverrides {
  can_user_add_activities?: boolean;
  calendar_activity_permissions?: CalendarActivityPermissions;
  editing_activity?: Option<Record<string, unknown>>;
}

const DEFAULT_EDITING_ACTIVITY = { id: "activity-1" };

function resolve_editing_activity(
  overrides?: CalendarActivityCommandOverrides,
): unknown {
  const editing_activity = overrides?.editing_activity;
  if (!editing_activity) return DEFAULT_EDITING_ACTIVITY;
  return editing_activity.status === OptionStatus.SOME
    ? editing_activity.value
    : void 0;
}

interface CalendarActivityTestState {
  activity_form_values: unknown;
  calendar_events: unknown[];
  categories: unknown[];
  editing_activity: unknown;
}

function create_test_state(
  overrides?: CalendarActivityCommandOverrides,
): CalendarActivityTestState {
  return {
    activity_form_values: { title: "Training" },
    calendar_events: [{ id: "event-1" }],
    categories: [{ id: "category-1" }],
    editing_activity: resolve_editing_activity(overrides),
  };
}

function create_command_getters(
  state: CalendarActivityTestState,
  overrides?: CalendarActivityCommandOverrides,
): {
  get_activity_form_values: () => never;
  get_can_user_add_activities: () => boolean;
  get_calendar_activity_permissions: () => CalendarActivityPermissions;
  get_calendar_events: () => never;
  get_categories: () => never;
  get_editing_activity: () => never;
  get_filter_category_id: () => string;
  get_filter_competition_id: () => string;
  get_filter_team_id: () => string;
  get_selected_organization_id: () => string;
} {
  return {
    get_activity_form_values: () => state.activity_form_values as never,
    get_can_user_add_activities: () =>
      overrides?.can_user_add_activities ?? true,
    get_calendar_activity_permissions: () =>
      overrides?.calendar_activity_permissions ??
      FULL_CALENDAR_ACTIVITY_PERMISSIONS,
    get_calendar_events: () => state.calendar_events as never,
    get_categories: () => state.categories as never,
    get_editing_activity: () => state.editing_activity as never,
    get_filter_category_id: () => "category-1",
    get_filter_competition_id: () => "competition-1",
    get_filter_team_id: () => "team-1",
    get_selected_organization_id: () => "organization-1",
  };
}

function create_command_setters(state: CalendarActivityTestState): {
  set_activity_form_values: Mock;
  set_calendar_events: Mock;
  set_categories: Mock;
  set_competitions: Mock;
  set_editing_activity: Mock;
  set_selected_event_details: Mock;
  set_show_category_modal: Mock;
  set_show_create_modal: Mock;
  set_show_subscribe_modal: Mock;
  set_teams: Mock;
  show_toast: Mock;
} {
  return {
    set_activity_form_values: vi.fn((value: unknown) => {
      state.activity_form_values = value as never;
    }),
    set_calendar_events: vi.fn((value: unknown[]) => {
      state.calendar_events = value as never;
    }),
    set_categories: vi.fn((value: unknown[]) => {
      state.categories = value as never;
    }),
    set_competitions: vi.fn(),
    set_editing_activity: vi.fn((value: unknown) => {
      state.editing_activity = value as never;
    }),
    set_selected_event_details: vi.fn(),
    set_show_category_modal: vi.fn(),
    set_show_create_modal: vi.fn(),
    set_show_subscribe_modal: vi.fn(),
    set_teams: vi.fn(),
    show_toast: vi.fn(),
  };
}

type CalendarActivityTestCommand = ReturnType<typeof create_command_getters> &
  ReturnType<typeof create_command_setters> & { use_cases: never };

export function create_command(overrides?: CalendarActivityCommandOverrides): {
  command: CalendarActivityTestCommand;
  state: CalendarActivityTestState;
} {
  const state = create_test_state(overrides);
  const command = {
    ...create_command_getters(state, overrides),
    ...create_command_setters(state),
    use_cases: {} as never,
  };

  return { command, state };
}
