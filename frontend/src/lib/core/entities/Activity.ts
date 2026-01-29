import type { BaseEntity } from "./BaseEntity";
import type { ActivityCategoryType } from "./ActivityCategory";

export type ActivityRecurrencePattern =
  | "none"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export type ActivityStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "postponed";

export type ActivitySourceType =
  | "manual"
  | "competition"
  | "fixture"
  | "google_calendar";

export interface ActivityReminder {
  id: string;
  minutes_before: number;
  is_enabled: boolean;
}

export interface ActivityRecurrence {
  pattern: ActivityRecurrencePattern;
  interval: number;
  end_date: string | null;
  days_of_week: number[];
}

export interface Activity extends BaseEntity {
  title: string;
  description: string;
  organization_id: string;
  category_id: string;
  category_type: ActivityCategoryType;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  location: string;
  venue_id: string | null;
  team_ids: string[];
  competition_id: string | null;
  fixture_id: string | null;
  source_type: ActivitySourceType;
  source_id: string | null;
  status: ActivityStatus;
  recurrence: ActivityRecurrence | null;
  reminders: ActivityReminder[];
  color_override: string | null;
  google_calendar_event_id: string | null;
  google_calendar_sync_enabled: boolean;
  last_synced_at: string | null;
  notes: string;
}

export type CreateActivityInput = Omit<
  Activity,
  | "id"
  | "created_at"
  | "updated_at"
  | "google_calendar_event_id"
  | "last_synced_at"
>;

export type UpdateActivityInput = Partial<
  Omit<
    Activity,
    "id" | "created_at" | "updated_at" | "source_type" | "source_id"
  >
>;

export const DEFAULT_REMINDERS: ActivityReminder[] = [
  { id: "reminder_1_day", minutes_before: 1440, is_enabled: true },
  { id: "reminder_1_hour", minutes_before: 60, is_enabled: false },
  { id: "reminder_30_min", minutes_before: 30, is_enabled: false },
];

export function validate_activity_input(input: CreateActivityInput): {
  is_valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length === 0) {
    errors.title = "Activity title is required";
  }

  if (input.title && input.title.trim().length > 200) {
    errors.title = "Activity title must be 200 characters or less";
  }

  if (!input.organization_id || input.organization_id.trim().length === 0) {
    errors.organization_id = "Organization is required";
  }

  if (!input.category_id || input.category_id.trim().length === 0) {
    errors.category_id = "Category is required";
  }

  if (!input.start_datetime) {
    errors.start_datetime = "Start date and time is required";
  }

  if (!input.end_datetime) {
    errors.end_datetime = "End date and time is required";
  }

  if (input.start_datetime && input.end_datetime) {
    const start_date = new Date(input.start_datetime);
    const end_date = new Date(input.end_datetime);
    if (end_date < start_date) {
      errors.end_datetime = "End date must be after start date";
    }
  }

  const is_valid = Object.keys(errors).length === 0;
  return { is_valid, errors };
}

export function create_activity_from_fixture(
  fixture_id: string,
  fixture_title: string,
  fixture_datetime: string,
  competition_id: string,
  home_team_id: string,
  away_team_id: string,
  organization_id: string,
  category_id: string,
  venue_location: string,
): CreateActivityInput {
  const start_datetime = new Date(fixture_datetime);
  const end_datetime = new Date(start_datetime.getTime() + 2 * 60 * 60 * 1000);

  return {
    title: fixture_title,
    description: `Match fixture`,
    organization_id,
    category_id,
    category_type: "fixture",
    start_datetime: start_datetime.toISOString(),
    end_datetime: end_datetime.toISOString(),
    is_all_day: false,
    location: venue_location,
    venue_id: null,
    team_ids: [home_team_id, away_team_id],
    competition_id,
    fixture_id,
    source_type: "fixture",
    source_id: fixture_id,
    status: "scheduled",
    recurrence: null,
    reminders: [...DEFAULT_REMINDERS],
    color_override: null,
    google_calendar_sync_enabled: false,
    notes: "",
  };
}

export function create_activity_from_competition(
  competition_id: string,
  competition_name: string,
  start_date: string,
  end_date: string,
  organization_id: string,
  category_id: string,
  location: string,
): CreateActivityInput {
  return {
    title: competition_name,
    description: `Competition: ${competition_name}`,
    organization_id,
    category_id,
    category_type: "competition",
    start_datetime: start_date,
    end_datetime: end_date,
    is_all_day: true,
    location,
    venue_id: null,
    team_ids: [],
    competition_id,
    fixture_id: null,
    source_type: "competition",
    source_id: competition_id,
    status: "scheduled",
    recurrence: null,
    reminders: [...DEFAULT_REMINDERS],
    color_override: null,
    google_calendar_sync_enabled: false,
    notes: "",
  };
}

export function get_activity_status_display(status: ActivityStatus): {
  label: string;
  color: string;
} {
  const status_map: Record<ActivityStatus, { label: string; color: string }> = {
    scheduled: {
      label: "Scheduled",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    },
    in_progress: {
      label: "In Progress",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    },
    completed: {
      label: "Completed",
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    },
    postponed: {
      label: "Postponed",
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    },
  };
  return status_map[status];
}

export function calculate_activity_duration_minutes(
  start_datetime: string,
  end_datetime: string,
): number {
  const start_date = new Date(start_datetime);
  const end_date = new Date(end_datetime);
  return Math.round((end_date.getTime() - start_date.getTime()) / (1000 * 60));
}

export function is_activity_recurring(activity: Activity): boolean {
  return activity.recurrence !== null && activity.recurrence.pattern !== "none";
}

export function is_activity_from_external_source(activity: Activity): boolean {
  return activity.source_type !== "manual";
}

export function can_edit_activity(activity: Activity): boolean {
  return (
    activity.source_type === "manual" ||
    activity.source_type === "google_calendar"
  );
}

export function can_delete_activity(activity: Activity): boolean {
  return activity.source_type === "manual";
}
