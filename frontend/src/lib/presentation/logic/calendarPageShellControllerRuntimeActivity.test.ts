import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_none_option } from "$lib/core/types/Option";

import { create_calendar_page_shell_controller_activity_actions } from "./calendarPageShellControllerRuntimeActivity";
import { create_command } from "./calendarPageShellControllerRuntimeActivity.test_support";

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
      editing_activity: create_none_option(),
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
});
