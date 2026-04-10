import type {
  Activity,
  CreateActivityInput,
} from "$lib/core/entities/Activity";
import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
import {
  type ActivityFormValues,
  build_activity_datetime_range,
  build_manual_activity_input,
} from "$lib/presentation/logic/calendarPageState";

interface CalendarPageActionFailure {
  success: false;
  error_message: string;
  error_type: "error" | "warning";
}

interface CalendarPageActionSuccess {
  success: true;
}

interface CalendarActivityUseCases {
  create(
    input: CreateActivityInput,
  ): Promise<{ success: boolean; error?: string }>;
  update(
    activity_id: string,
    input: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }>;
  delete(activity_id: string): Promise<{ success: boolean; error?: string }>;
}

interface CalendarCategoryUseCases {
  create(
    input: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }>;
}

export async function save_calendar_activity_action(command: {
  activity_form_values: ActivityFormValues;
  categories: ActivityCategory[];
  editing_activity: Activity | null;
  selected_organization_id: string;
  activity_use_cases: CalendarActivityUseCases;
}): Promise<CalendarPageActionFailure | CalendarPageActionSuccess> {
  if (!command.activity_form_values.title.trim())
    return {
      success: false,
      error_message: "Please enter an activity title",
      error_type: "warning",
    };
  if (!command.activity_form_values.category_id)
    return {
      success: false,
      error_message: "Please select a category",
      error_type: "warning",
    };
  if (
    !command.activity_form_values.start_date ||
    !command.activity_form_values.end_date
  )
    return {
      success: false,
      error_message: "Please select start and end dates",
      error_type: "warning",
    };
  const selected_category = command.categories.find(
    (category) => category.id === command.activity_form_values.category_id,
  );
  if (!selected_category)
    return {
      success: false,
      error_message: "Please select a category",
      error_type: "warning",
    };
  if (command.editing_activity) {
    const datetime_range = build_activity_datetime_range(
      command.activity_form_values,
    );
    const result = await command.activity_use_cases.update(
      command.editing_activity.id,
      {
        title: command.activity_form_values.title,
        description: command.activity_form_values.description,
        category_id: command.activity_form_values.category_id,
        category_type: selected_category.category_type,
        start_datetime: datetime_range.start_datetime,
        end_datetime: datetime_range.end_datetime,
        is_all_day: command.activity_form_values.is_all_day,
        location: command.activity_form_values.location,
      },
    );
    return result.success
      ? { success: true }
      : {
          success: false,
          error_message: result.error || "Failed to update activity",
          error_type: "error",
        };
  }
  const create_input: CreateActivityInput = build_manual_activity_input(
    command.activity_form_values,
    command.selected_organization_id,
    selected_category,
  );
  const result = await command.activity_use_cases.create(create_input);
  return result.success
    ? { success: true }
    : {
        success: false,
        error_message: result.error || "Failed to create activity",
        error_type: "error",
      };
}

export async function delete_calendar_activity_action(command: {
  editing_activity: Activity | null;
  activity_use_cases: CalendarActivityUseCases;
}): Promise<CalendarPageActionFailure | CalendarPageActionSuccess> {
  if (!command.editing_activity)
    return {
      success: false,
      error_message: "No activity selected",
      error_type: "error",
    };
  const result = await command.activity_use_cases.delete(
    command.editing_activity.id,
  );
  return result.success
    ? { success: true }
    : {
        success: false,
        error_message: result.error || "Failed to delete activity",
        error_type: "error",
      };
}

export async function create_calendar_category_action(command: {
  category_name: string;
  category_color: string;
  category_type: string;
  selected_organization_id: string;
  activity_category_use_cases: CalendarCategoryUseCases;
}): Promise<CalendarPageActionFailure | CalendarPageActionSuccess> {
  if (!command.category_name.trim())
    return {
      success: false,
      error_message: "Please enter a category name",
      error_type: "warning",
    };
  const result = await command.activity_category_use_cases.create({
    name: command.category_name,
    description: "",
    organization_id: command.selected_organization_id,
    category_type: command.category_type,
    color: command.category_color,
    icon: "star",
    is_system_generated: false,
  });
  return result.success
    ? { success: true }
    : {
        success: false,
        error_message: result.error || "Failed to create category",
        error_type: "error",
      };
}
