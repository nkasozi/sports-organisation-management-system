import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("calendarPageShellControllerRuntimeActivity persistence", () => {
  beforeEach(() => {
    create_activity_form_values_for_date_mock.mockReset();
    create_activity_form_values_for_date_time_mock.mockReset();
    create_calendar_shell_category_mock.mockReset();
    create_empty_activity_form_values_mock.mockReset();
    delete_calendar_shell_activity_mock.mockReset();
    resolve_calendar_event_click_mock.mockReset();
    save_calendar_shell_activity_mock.mockReset();
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
