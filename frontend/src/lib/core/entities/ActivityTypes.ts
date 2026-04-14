import type {
  EntityId,
  IsoDateString,
  IsoDateTimeString,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
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
  end_date: IsoDateString | null;
  days_of_week: number[];
}

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
  venue_id: EntityId | null;
  team_ids: EntityId[];
  competition_id: EntityId | null;
  fixture_id: EntityId | null;
  source_type: ActivitySourceType;
  source_id: EntityId | null;
  status: ActivityStatus;
  recurrence: ActivityRecurrence | null;
  reminders: ActivityReminder[];
  color_override: string | null;
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
