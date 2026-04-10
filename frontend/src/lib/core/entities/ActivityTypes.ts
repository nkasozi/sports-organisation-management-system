import type { ActivityCategoryType } from "./ActivityCategory";
import type { BaseEntity } from "./BaseEntity";

type ActivityRecurrencePattern =
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

export type ActivitySourceType = "manual" | "competition" | "fixture";

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
  notes: string;
}

export type CreateActivityInput = Omit<
  Activity,
  "id" | "created_at" | "updated_at"
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
