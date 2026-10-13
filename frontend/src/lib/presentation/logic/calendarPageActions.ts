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

type SaveCalendarActivityCommand = Parameters<
  typeof save_calendar_activity_action
>[0];

type CalendarActivityCategoryResolution =
  | CalendarPageActionFailure
  | { success: true; selected_category: ActivityCategory };

function create_calendar_validation_warning(
  error_message: string,
): CalendarPageActionFailure {
  return { success: false, error_message, error_type: "warning" };
}

function resolve_valid_calendar_activity_category(
  command: SaveCalendarActivityCommand,
): CalendarActivityCategoryResolution {
  const form_values = command.activity_form_values;
  if (!form_values.title.trim())
    return create_calendar_validation_warning("Please enter an activity title");
  if (!form_values.category_id)
    return create_calendar_validation_warning("Please select a category");
  if (!form_values.start_date || !form_values.end_date)
    return create_calendar_validation_warning(
      "Please select start and end dates",
    );
  const selected_category = command.categories.find(
    (category) => category.id === form_values.category_id,
  );
  if (!selected_category)
    return create_calendar_validation_warning("Please select a category");
  return { success: true, selected_category };
}

function to_calendar_action_result(
  result: { success: boolean; error?: string },
  default_error_message: string,
): CalendarPageActionFailure | CalendarPageActionSuccess {
  return result.success
    ? { success: true }
    : {
        success: false,
        error_message: result.error || default_error_message,
        error_type: "error",
      };
}

async function update_calendar_activity(
  command: SaveCalendarActivityCommand,
  editing_activity: Activity,
  selected_category: ActivityCategory,
): Promise<CalendarPageActionFailure | CalendarPageActionSuccess> {
  const form_values = command.activity_form_values;
  const datetime_range = build_activity_datetime_range(form_values);
  const result = await command.activity_use_cases.update(editing_activity.id, {
    title: form_values.title,
    description: form_values.description,
    category_id: form_values.category_id,
    category_type: selected_category.category_type,
    start_datetime: datetime_range.start_datetime,
    end_datetime: datetime_range.end_datetime,
    is_all_day: form_values.is_all_day,
    location: form_values.location,
  });
  return to_calendar_action_result(result, "Failed to update activity");
}

export async function save_calendar_activity_action(command: {
  activity_form_values: ActivityFormValues;
  categories: ActivityCategory[];
  editing_activity: Activity | undefined;
  selected_organization_id: string;
  activity_use_cases: CalendarActivityUseCases;
}): Promise<CalendarPageActionFailure | CalendarPageActionSuccess> {
  const category_resolution = resolve_valid_calendar_activity_category(command);
  if (!category_resolution.success) return category_resolution;
  const selected_category = category_resolution.selected_category;
  if (command.editing_activity)
    return update_calendar_activity(
      command,
      command.editing_activity,
      selected_category,
    );
  const create_input: CreateActivityInput = build_manual_activity_input(
    command.activity_form_values,
    command.selected_organization_id,
    selected_category,
  );
  const result = await command.activity_use_cases.create(create_input);
  return to_calendar_action_result(result, "Failed to create activity");
}

export async function delete_calendar_activity_action(command: {
  editing_activity: Activity | undefined;
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
  return to_calendar_action_result(result, "Failed to delete activity");
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
  return to_calendar_action_result(result, "Failed to create category");
}
