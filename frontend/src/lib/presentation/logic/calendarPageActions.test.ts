import { beforeEach, describe, expect, it, vi } from "vitest";

const { build_activity_datetime_range_mock, build_manual_activity_input_mock } =
  vi.hoisted(() => ({
    build_activity_datetime_range_mock: vi.fn(),
    build_manual_activity_input_mock: vi.fn(),
  }));

vi.mock("$lib/presentation/logic/calendarPageState", () => ({
  build_activity_datetime_range: build_activity_datetime_range_mock,
  build_manual_activity_input: build_manual_activity_input_mock,
}));

import {
  create_calendar_category_action,
  delete_calendar_activity_action,
  save_calendar_activity_action,
} from "./calendarPageActions";

describe("calendarPageActions", () => {
  beforeEach(() => {
    build_activity_datetime_range_mock.mockReset();
    build_manual_activity_input_mock.mockReset();
  });

  it("validates required activity fields before calling the use cases", async () => {
    const activity_use_cases = {
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    };

    await expect(
      save_calendar_activity_action({
        activity_form_values: {
          title: " ",
          category_id: "category-1",
          start_date: "2024-06-01",
          end_date: "2024-06-01",
        } as never,
        categories: [],
        editing_activity: null,
        selected_organization_id: "organization-1",
        activity_use_cases,
      }),
    ).resolves.toEqual({
      success: false,
      error_message: "Please enter an activity title",
      error_type: "warning",
    });

    expect(activity_use_cases.create).not.toHaveBeenCalled();
  });

  it("updates an existing activity using the resolved category type and datetime range", async () => {
    build_activity_datetime_range_mock.mockReturnValueOnce({
      start_datetime: "2024-06-01T09:00:00.000Z",
      end_datetime: "2024-06-01T11:00:00.000Z",
    });
    const update = vi.fn().mockResolvedValueOnce({ success: true });

    await expect(
      save_calendar_activity_action({
        activity_form_values: {
          title: "Training",
          description: "Session",
          category_id: "category-1",
          start_date: "2024-06-01",
          end_date: "2024-06-01",
          is_all_day: false,
          location: "Field A",
        } as never,
        categories: [{ id: "category-1", category_type: "training" }] as never,
        editing_activity: { id: "activity-1" } as never,
        selected_organization_id: "organization-1",
        activity_use_cases: {
          create: vi.fn(),
          delete: vi.fn(),
          update,
        },
      }),
    ).resolves.toEqual({ success: true });

    expect(update).toHaveBeenCalledWith("activity-1", {
      title: "Training",
      description: "Session",
      category_id: "category-1",
      category_type: "training",
      start_datetime: "2024-06-01T09:00:00.000Z",
      end_datetime: "2024-06-01T11:00:00.000Z",
      is_all_day: false,
      location: "Field A",
    });
  });

  it("creates a new activity from the manual input builder and returns create failures", async () => {
    build_manual_activity_input_mock.mockReturnValueOnce({ built: true });
    const create = vi
      .fn()
      .mockResolvedValueOnce({ success: false, error: "create failed" });

    await expect(
      save_calendar_activity_action({
        activity_form_values: {
          title: "Training",
          category_id: "category-1",
          start_date: "2024-06-01",
          end_date: "2024-06-01",
        } as never,
        categories: [{ id: "category-1", category_type: "training" }] as never,
        editing_activity: null,
        selected_organization_id: "organization-1",
        activity_use_cases: {
          create,
          delete: vi.fn(),
          update: vi.fn(),
        },
      }),
    ).resolves.toEqual({
      success: false,
      error_message: "create failed",
      error_type: "error",
    });
    expect(create).toHaveBeenCalledWith({ built: true });
  });

  it("deletes the current activity and validates category creation input", async () => {
    const delete_activity = vi.fn().mockResolvedValueOnce({ success: true });

    await expect(
      delete_calendar_activity_action({
        editing_activity: { id: "activity-1" } as never,
        activity_use_cases: {
          create: vi.fn(),
          delete: delete_activity,
          update: vi.fn(),
        },
      }),
    ).resolves.toEqual({ success: true });
    expect(delete_activity).toHaveBeenCalledWith("activity-1");

    await expect(
      create_calendar_category_action({
        category_name: " ",
        category_color: "#ff0",
        category_type: "training",
        selected_organization_id: "organization-1",
        activity_category_use_cases: { create: vi.fn() },
      }),
    ).resolves.toEqual({
      success: false,
      error_message: "Please enter a category name",
      error_type: "warning",
    });

    const create_category = vi.fn().mockResolvedValueOnce({ success: true });
    await expect(
      create_calendar_category_action({
        category_name: "Training",
        category_color: "#ff0",
        category_type: "training",
        selected_organization_id: "organization-1",
        activity_category_use_cases: { create: create_category },
      }),
    ).resolves.toEqual({ success: true });
    expect(create_category).toHaveBeenCalledWith({
      name: "Training",
      description: "",
      organization_id: "organization-1",
      category_type: "training",
      color: "#ff0",
      icon: "star",
      is_system_generated: false,
    });
  });
});
