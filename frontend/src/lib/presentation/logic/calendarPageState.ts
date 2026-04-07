import type {
  Activity,
  CreateActivityInput,
} from "$lib/core/entities/Activity";
import { DEFAULT_REMINDERS } from "$lib/core/entities/Activity";
import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";

export interface ActivityFormValues {
  title: string;
  description: string;
  category_id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  is_all_day: boolean;
  location: string;
}

export function get_current_year_date_range(
  reference_date: Date = new Date(),
): { start_date: string; end_date: string } {
  const year = reference_date.getFullYear();
  return { start_date: `${year}-01-01`, end_date: `${year}-12-31` };
}

export function build_calendar_colors(categories: ActivityCategory[]): Record<
  string,
  {
    colorName: string;
    lightColors: { main: string; container: string; onContainer: string };
    darkColors: { main: string; container: string; onContainer: string };
  }
> {
  const colors: Record<
    string,
    {
      colorName: string;
      lightColors: { main: string; container: string; onContainer: string };
      darkColors: { main: string; container: string; onContainer: string };
    }
  > = {};

  for (const category of categories) {
    colors[category.category_type] = {
      colorName: category.name,
      lightColors: {
        main: category.color,
        container: `${category.color}20`,
        onContainer: category.color,
      },
      darkColors: {
        main: category.color,
        container: `${category.color}40`,
        onContainer: "#FFFFFF",
      },
    };
  }

  return colors;
}

export function create_empty_activity_form_values(): ActivityFormValues {
  return {
    title: "",
    description: "",
    category_id: "",
    start_date: "",
    start_time: "09:00",
    end_date: "",
    end_time: "10:00",
    is_all_day: false,
    location: "",
  };
}

export function create_activity_form_values_from_activity(
  activity: Activity,
): ActivityFormValues {
  return {
    title: activity.title,
    description: activity.description,
    category_id: activity.category_id,
    start_date: activity.start_datetime.split("T")[0],
    start_time:
      activity.start_datetime.split("T")[1]?.substring(0, 5) || "09:00",
    end_date: activity.end_datetime.split("T")[0],
    end_time: activity.end_datetime.split("T")[1]?.substring(0, 5) || "10:00",
    is_all_day: activity.is_all_day,
    location: activity.location,
  };
}

export function build_activity_datetime_range(
  activity_form_values: ActivityFormValues,
): { start_datetime: string; end_datetime: string } {
  return {
    start_datetime: activity_form_values.is_all_day
      ? `${activity_form_values.start_date}T00:00:00`
      : `${activity_form_values.start_date}T${activity_form_values.start_time}:00`,
    end_datetime: activity_form_values.is_all_day
      ? `${activity_form_values.end_date}T23:59:59`
      : `${activity_form_values.end_date}T${activity_form_values.end_time}:00`,
  };
}

export function build_manual_activity_input(
  activity_form_values: ActivityFormValues,
  organization_id: string,
  category: ActivityCategory,
): CreateActivityInput {
  const activity_datetimes =
    build_activity_datetime_range(activity_form_values);
  return {
    title: activity_form_values.title,
    description: activity_form_values.description,
    organization_id,
    category_id: category.id,
    category_type: category.category_type,
    start_datetime: activity_datetimes.start_datetime,
    end_datetime: activity_datetimes.end_datetime,
    is_all_day: activity_form_values.is_all_day,
    location: activity_form_values.location,
    venue_id: null,
    team_ids: [],
    competition_id: null,
    fixture_id: null,
    source_type: "manual",
    source_id: null,
    status: "scheduled",
    recurrence: null,
    reminders: [...DEFAULT_REMINDERS],
    color_override: null,
    notes: "",
  };
}
