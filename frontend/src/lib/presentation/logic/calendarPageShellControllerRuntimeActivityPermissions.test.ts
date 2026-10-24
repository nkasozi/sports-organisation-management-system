import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_calendar_page_shell_controller_activity_actions } from "./calendarPageShellControllerRuntimeActivity";
import { create_command } from "./calendarPageShellControllerRuntimeActivity.test_support";

const {
  create_calendar_shell_category_mock,
  delete_calendar_shell_activity_mock,
  resolve_calendar_event_click_mock,
  save_calendar_shell_activity_mock,
} = vi.hoisted(() => ({
  create_calendar_shell_category_mock: vi.fn(),
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
  create_activity_form_values_for_date: vi.fn(),
  create_activity_form_values_for_date_time: vi.fn(),
  resolve_calendar_event_click: resolve_calendar_event_click_mock,
}));

vi.mock("$lib/presentation/logic/calendarPageState", () => ({
  create_empty_activity_form_values: vi.fn(),
}));

const READ_ONLY_PERMISSIONS = {
  can_create_activity: false,
  can_edit_activity: false,
  can_delete_activity: false,
  can_create_category: false,
};

function create_read_only_actions(): {
  command: ReturnType<typeof create_command>["command"];
  runtime: ReturnType<
    typeof create_calendar_page_shell_controller_activity_actions
  >;
} {
  const { command } = create_command({
    can_user_add_activities: false,
    calendar_activity_permissions: READ_ONLY_PERMISSIONS,
  });
  const runtime = create_calendar_page_shell_controller_activity_actions(
    command as never,
  );
  return { command, runtime };
}

describe("calendar activity actions for read-only users", () => {
  beforeEach(() => {
    create_calendar_shell_category_mock.mockReset();
    delete_calendar_shell_activity_mock.mockReset();
    resolve_calendar_event_click_mock.mockReset();
    save_calendar_shell_activity_mock.mockReset();
  });

  it("shows event details instead of the edit form", () => {
    const { command, runtime } = create_read_only_actions();
    resolve_calendar_event_click_mock.mockReturnValueOnce({
      editing_activity: { id: "activity-1" },
      activity_form_values: { title: "Edit form" },
      show_create_modal: true,
    });

    runtime.handle_event_click("event-1");

    expect(command.set_show_create_modal).not.toHaveBeenCalledWith(true);
    expect(command.set_editing_activity).not.toHaveBeenCalled();
    expect(command.set_selected_event_details).toHaveBeenCalledWith({
      id: "event-1",
    });
  });

  it("refuses to save changes to an existing activity", async () => {
    const { command, runtime } = create_read_only_actions();

    await runtime.handle_save_activity();

    expect(save_calendar_shell_activity_mock).not.toHaveBeenCalled();
    expect(command.show_toast).toHaveBeenCalledWith(
      "You do not have permission to change activities.",
      "warning",
    );
  });

  it("refuses to delete an activity", async () => {
    const { command, runtime } = create_read_only_actions();

    const deleted = await runtime.delete_current_activity();

    expect(deleted).toBe(false);
    expect(delete_calendar_shell_activity_mock).not.toHaveBeenCalled();
    expect(command.show_toast).toHaveBeenCalledWith(
      "You do not have permission to delete activities.",
      "warning",
    );
  });

  it("refuses to open the category form or create a category", async () => {
    const { command, runtime } = create_read_only_actions();

    runtime.open_category_modal();
    await runtime.handle_create_category("Training", "#ff0000", "training");

    expect(command.set_show_category_modal).not.toHaveBeenCalledWith(true);
    expect(create_calendar_shell_category_mock).not.toHaveBeenCalled();
    expect(command.show_toast).toHaveBeenCalledWith(
      "You do not have permission to create categories.",
      "warning",
    );
  });

  it("still lets everyone subscribe to the calendar", () => {
    const { command, runtime } = create_read_only_actions();

    runtime.open_subscribe_modal();

    expect(command.set_show_subscribe_modal).toHaveBeenCalledWith(true);
  });
});

describe("calendar activity actions for administrators", () => {
  beforeEach(() => {
    create_calendar_shell_category_mock.mockReset();
    delete_calendar_shell_activity_mock.mockReset();
    save_calendar_shell_activity_mock.mockReset();
  });

  it("keeps saving, deleting and category creation available", async () => {
    const { command } = create_command();
    const runtime = create_calendar_page_shell_controller_activity_actions(
      command as never,
    );
    save_calendar_shell_activity_mock.mockResolvedValueOnce({
      success: true,
      calendar_events: [],
    });
    delete_calendar_shell_activity_mock.mockResolvedValueOnce({
      success: true,
      calendar_events: [],
    });
    create_calendar_shell_category_mock.mockResolvedValueOnce({
      success: true,
      categories: [],
    });

    runtime.open_category_modal();
    await runtime.delete_current_activity();
    await runtime.handle_save_activity();
    await runtime.handle_create_category("Training", "#ff0000", "training");

    expect(command.set_show_category_modal).toHaveBeenCalledWith(true);
    expect(save_calendar_shell_activity_mock).toHaveBeenCalledTimes(1);
    expect(delete_calendar_shell_activity_mock).toHaveBeenCalledTimes(1);
    expect(create_calendar_shell_category_mock).toHaveBeenCalledTimes(1);
  });

  it("lets an editor without delete rights save but not delete", async () => {
    const { command } = create_command({
      calendar_activity_permissions: {
        can_create_activity: true,
        can_edit_activity: true,
        can_delete_activity: false,
        can_create_category: true,
      },
    });
    const runtime = create_calendar_page_shell_controller_activity_actions(
      command as never,
    );

    save_calendar_shell_activity_mock.mockResolvedValueOnce({
      success: true,
      calendar_events: [],
    });

    await runtime.handle_save_activity();
    const deleted = await runtime.delete_current_activity();

    expect(save_calendar_shell_activity_mock).toHaveBeenCalledTimes(1);
    expect(deleted).toBe(false);
    expect(delete_calendar_shell_activity_mock).not.toHaveBeenCalled();
  });
});
