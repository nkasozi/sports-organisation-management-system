import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_calendar_page_shell_controller_activity_actions } from "./calendarPageShellControllerRuntimeActivity";

const {
  create_activity_form_values_for_date_mock,
  create_activity_form_values_for_date_time_mock,
  create_calendar_shell_category_mock,
  create_empty_activity_form_values_mock,
  delete_calendar_shell_activity_mock,
  resolve_calendar_event_click_mock,
  save_calendar_shell_activity_mock,
} = vi.hoisted(() => ({
  create_activity_form_values_for_date_mock: vi.fn(),
  create_activity_form_values_for_date_time_mock: vi.fn(),
  create_calendar_shell_category_mock: vi.fn(),
  create_empty_activity_form_values_mock: vi.fn(),
  delete_calendar_shell_activity_mock: vi.fn(),
  resolve_calendar_event_click_mock: vi.fn(),
  save_calendar_shell_activity_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/calendarPageShellControllerData", () => ({
  create_calendar_shell_category: create_calendar_shell_category_mock,
  delete_calendar_shell_activity: delete_calendar_shell_activity_mock,
  save_calendar_shell_activity: save_calendar_shell_activity_mock,
}));

vi.mock("$lib/presentation/logic/calendarPageShellControllerHelpers", () => ({
  create_activity_form_values_for_date:
    create_activity_form_values_for_date_mock,
  create_activity_form_values_for_date_time:
    create_activity_form_values_for_date_time_mock,
  resolve_calendar_event_click: resolve_calendar_event_click_mock,
}));

vi.mock("$lib/presentation/logic/calendarPageState", () => ({
  create_empty_activity_form_values: create_empty_activity_form_values_mock,
}));

describe("calendarPageShellControllerRuntimeActivity", () => {
  function create_command(overrides?: {
    can_user_add_activities?: boolean;
    editing_activity?: Record<string, unknown> | undefined;
  }) {
    const has_editing_activity_override =
      overrides !== undefined && "editing_activity" in overrides;
    const state = {
      activity_form_values: { title: "Training" },
      calendar_events: [{ id: "event-1" }],
      categories: [{ id: "category-1" }],
      editing_activity: has_editing_activity_override
        ? (overrides.editing_activity as never)
        : ({ id: "activity-1" } as never),
    };

    const command = {
      get_activity_form_values: () => state.activity_form_values as never,
      get_can_user_add_activities: () =>
        overrides?.can_user_add_activities ?? true,
      get_calendar_events: () => state.calendar_events as never,
      get_categories: () => state.categories as never,
      get_editing_activity: () => state.editing_activity as never,
      get_filter_category_id: () => "category-1",
      get_filter_competition_id: () => "competition-1",
      get_filter_team_id: () => "team-1",
      get_selected_organization_id: () => "organization-1",
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
      use_cases: {} as never,
    };

    return { command, state };
  }

  beforeEach(() => {
    create_activity_form_values_for_date_mock.mockReset();
    create_activity_form_values_for_date_time_mock.mockReset();
    create_calendar_shell_category_mock.mockReset();
    create_empty_activity_form_values_mock.mockReset();
    delete_calendar_shell_activity_mock.mockReset();
    resolve_calendar_event_click_mock.mockReset();
    save_calendar_shell_activity_mock.mockReset();
  });

  it("opens the create modal from date and date-time selections and resets it when closed", () => {
    const { command } = create_command();
    create_activity_form_values_for_date_mock.mockReturnValueOnce({
      title: "Date form",
    });
    create_activity_form_values_for_date_time_mock.mockReturnValueOnce({
      title: "Date-time form",
    });
    create_empty_activity_form_values_mock.mockReturnValueOnce({
      title: "Empty form",
    });
    const runtime = create_calendar_page_shell_controller_activity_actions(
      command as never,
    );

    runtime.handle_date_click("2024-06-01");
    runtime.handle_date_time_click("2024-06-01", "09:30");
    runtime.close_create_modal();

    expect(command.set_activity_form_values).toHaveBeenCalledWith({
      title: "Date form",
    });
    expect(command.set_activity_form_values).toHaveBeenCalledWith({
      title: "Date-time form",
    });
    expect(command.set_show_create_modal).toHaveBeenCalledWith(false);
    expect(command.set_editing_activity).toHaveBeenCalledWith();
  });

  it("routes event clicks to edit mode or event details based on the resolved selection", () => {
    const { command } = create_command();
    resolve_calendar_event_click_mock
      .mockReturnValueOnce({
        editing_activity: { id: "activity-2" },
        activity_form_values: { title: "Edit form" },
        show_create_modal: true,
      })
      .mockReturnValueOnce({ selected_event_details: { id: "event-2" } });
    const runtime = create_calendar_page_shell_controller_activity_actions(
      command as never,
    );

    runtime.handle_event_click("event-1");
    runtime.handle_event_click("event-2");

    expect(command.set_editing_activity).toHaveBeenCalledWith({
      id: "activity-2",
    });
    expect(command.set_activity_form_values).toHaveBeenCalledWith({
      title: "Edit form",
    });
    expect(command.set_selected_event_details).toHaveBeenCalledWith({
      id: "event-2",
    });
  });

  it("blocks unauthorized create flows from opening or saving a new activity", async () => {
    const { command } = create_command({
      can_user_add_activities: false,
      editing_activity: undefined,
    });
    const runtime = create_calendar_page_shell_controller_activity_actions(
      command as never,
    );

    runtime.handle_date_click("2024-06-01");
    runtime.handle_date_time_click("2024-06-01", "09:30");
    await runtime.handle_save_activity();

    expect(create_activity_form_values_for_date_mock).not.toHaveBeenCalled();
    expect(
      create_activity_form_values_for_date_time_mock,
    ).not.toHaveBeenCalled();
    expect(command.set_show_create_modal).not.toHaveBeenCalledWith(true);
    expect(save_calendar_shell_activity_mock).not.toHaveBeenCalled();
    expect(command.show_toast).toHaveBeenCalledWith(
      "You do not have permission to create activities.",
      "warning",
    );
  });

  it("saves and deletes activities, refreshing events on success and surfacing failures as toasts", async () => {
    const save_case = create_command();
    const save_runtime = create_calendar_page_shell_controller_activity_actions(
      save_case.command as never,
    );
    save_calendar_shell_activity_mock
      .mockResolvedValueOnce({
        success: false,
        error_message: "save failed",
        error_type: "error",
      })
      .mockResolvedValueOnce({
        success: true,
        calendar_events: [{ id: "event-2" }],
      });
    create_empty_activity_form_values_mock.mockReturnValue({
      title: "Empty form",
    });

    await save_runtime.handle_save_activity();
    await save_runtime.handle_save_activity();

    expect(save_case.command.show_toast).toHaveBeenCalledWith(
      "save failed",
      "error",
    );
    expect(save_case.command.set_calendar_events).toHaveBeenCalledWith([
      { id: "event-2" },
    ]);

    const delete_case = create_command();
    const delete_runtime =
      create_calendar_page_shell_controller_activity_actions(
        delete_case.command as never,
      );
    delete_calendar_shell_activity_mock
      .mockResolvedValueOnce({
        success: false,
        error_message: "delete failed",
        error_type: "error",
      })
      .mockResolvedValueOnce({
        success: true,
        calendar_events: [{ id: "event-3" }],
      });

    await delete_runtime.delete_current_activity();
    await delete_runtime.delete_current_activity();

    expect(delete_case.command.show_toast).toHaveBeenCalledWith(
      "delete failed",
      "error",
    );
    expect(delete_case.command.set_calendar_events).toHaveBeenCalledWith([
      { id: "event-3" },
    ]);
  });

  it("creates categories and toggles the category and subscribe modals", async () => {
    const { command } = create_command();
    const runtime = create_calendar_page_shell_controller_activity_actions(
      command as never,
    );
    create_calendar_shell_category_mock
      .mockResolvedValueOnce({
        success: false,
        error_message: "category failed",
        error_type: "warning",
      })
      .mockResolvedValueOnce({
        success: true,
        categories: [{ id: "category-2" }],
      });

    runtime.open_category_modal();
    runtime.open_subscribe_modal();
    runtime.close_subscribe_modal();
    runtime.close_event_details_modal();
    await runtime.handle_create_category("Training", "#fff", "training");
    await runtime.handle_create_category("Training", "#fff", "training");

    expect(command.set_show_category_modal).toHaveBeenCalledWith(true);
    expect(command.set_show_subscribe_modal).toHaveBeenCalledWith(true);
    expect(command.set_show_subscribe_modal).toHaveBeenCalledWith(false);
    expect(command.set_selected_event_details).toHaveBeenCalledWith();
    expect(command.show_toast).toHaveBeenCalledWith(
      "category failed",
      "warning",
    );
    expect(command.set_categories).toHaveBeenCalledWith([{ id: "category-2" }]);
    expect(command.set_show_category_modal).toHaveBeenCalledWith(false);
  });
});
