import type {
  EntityId,
  IsoDateString,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { ActivityCategoryType } from "./ActivityCategory";
import type { BaseEntity } from "./BaseEntity";
import { ACTIVITY_SOURCE_TYPE } from "./StatusConstants";

const ACTIVITY_RECURRENCE_PATTERN = {
  NONE: "none",
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

type ActivityRecurrencePattern =
  (typeof ACTIVITY_RECURRENCE_PATTERN)[keyof typeof ACTIVITY_RECURRENCE_PATTERN];

export const ACTIVITY_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  POSTPONED: "postponed",
} as const;

export type ActivityStatus =
  (typeof ACTIVITY_STATUS)[keyof typeof ACTIVITY_STATUS];

export type ActivitySourceType =
  (typeof ACTIVITY_SOURCE_TYPE)[keyof typeof ACTIVITY_SOURCE_TYPE];

export interface ActivityReminder {
  id: string;
  minutes_before: number;
  is_enabled: boolean;
}

export interface ActivityRecurrence {
  pattern: ActivityRecurrencePattern;
  interval: number;
  end_date: IsoDateString | "";
  days_of_week: number[];
}

export const NO_ACTIVITY_RECURRENCE: ActivityRecurrence = {
  pattern: ACTIVITY_RECURRENCE_PATTERN.NONE,
  interval: 1,
  end_date: "",
  days_of_week: [],
};

export interface Activity extends BaseEntity {
  title: Name;
  description: string;
  organization_id: EntityId;
  category_id: EntityId;
  category_type: ActivityCategoryType;
  start_datetime: IsoDateTimeString;
  end_datetime: IsoDateTimeString;
  is_all_day: boolean;
  location: string;
  venue_id: EntityId;
  team_ids: EntityId[];
  competition_id: EntityId;
  fixture_id: EntityId;
  source_type: ActivitySourceType;
  source_id: EntityId;
  status: ActivityStatus;
  recurrence: ActivityRecurrence;
  reminders: ActivityReminder[];
  color_override: string;
  notes: string;
}

export type CreateActivityInput = Omit<
  ScalarInput<Activity>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateActivityInput = Partial<
  Omit<
    ScalarInput<Activity>,
    "id" | "created_at" | "updated_at" | "source_type" | "source_id"
  >
>;

export const DEFAULT_REMINDERS: ActivityReminder[] = [
  { id: "reminder_1_day", minutes_before: 1440, is_enabled: true },
  { id: "reminder_1_hour", minutes_before: 60, is_enabled: false },
  { id: "reminder_30_min", minutes_before: 30, is_enabled: false },
];
