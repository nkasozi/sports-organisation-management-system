import { describe, expect, it, vi } from "vitest";

import { save_calendar_activity_action } from "./calendarPageActions";

vi.mock("$lib/presentation/logic/calendarPageState", () => ({
  build_activity_datetime_range: vi.fn(() => ({
    start_datetime: "start",
    end_datetime: "end",
  })),
  build_manual_activity_input: vi.fn(() => ({ built: true })),
}));

const VALID_FORM_VALUES = {
  title: "Training",
  category_id: "category-1",
  start_date: "2024-06-01",
  end_date: "2024-06-01",
};

function create_activity_use_cases(
  update_result: { success: boolean; error?: string } = { success: true },
): {
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
} {
  return {
    create: vi.fn(),
    delete: vi.fn(),
    update: vi.fn().mockResolvedValue(update_result),
  };
}

async function save_with(
  form_overrides: Record<string, unknown>,
  categories: unknown[],
  activity_use_cases = create_activity_use_cases(),
  editing_activity: unknown = void 0,
): Promise<unknown> {
  return save_calendar_activity_action({
    activity_form_values: { ...VALID_FORM_VALUES, ...form_overrides } as never,
    categories: categories as never,
    editing_activity: editing_activity as never,
    selected_organization_id: "organization-1",
    activity_use_cases: activity_use_cases as never,
  });
}

function warning(error_message: string): Record<string, unknown> {
  return { success: false, error_message, error_type: "warning" };
}

describe("calendarPageActions validation", () => {
  it("requires a category, both dates and a known category", async () => {
    const known_categories = [{ id: "category-1", category_type: "training" }];

    await expect(
      save_with({ category_id: "" }, known_categories),
    ).resolves.toEqual(warning("Please select a category"));
    await expect(
      save_with({ end_date: "" }, known_categories),
    ).resolves.toEqual(warning("Please select start and end dates"));
    await expect(
      save_with({ start_date: "" }, known_categories),
    ).resolves.toEqual(warning("Please select start and end dates"));
    await expect(save_with({}, [])).resolves.toEqual(
      warning("Please select a category"),
    );
  });

  it("reports update failures with the default message when no error is given", async () => {
    const activity_use_cases = create_activity_use_cases({ success: false });

    await expect(
      save_with(
        {},
        [{ id: "category-1", category_type: "training" }],
        activity_use_cases,
        { id: "activity-1" },
      ),
    ).resolves.toEqual({
      success: false,
      error_message: "Failed to update activity",
      error_type: "error",
    });
    expect(activity_use_cases.create).not.toHaveBeenCalled();
  });
});
