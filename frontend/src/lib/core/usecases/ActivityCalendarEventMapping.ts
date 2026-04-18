import type { Activity } from "../entities/Activity";
import { can_delete_activity, can_edit_activity } from "../entities/Activity";
import type { ActivityCategory } from "../entities/ActivityCategory";
import type {
  ActivityFilter,
  CalendarDateRange,
  CalendarEvent,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";

const DEFAULT_ACTIVITY_COLOR = "#3B82F6";
const UNKNOWN_CATEGORY_NAME = "Unknown";

export function build_activity_date_range_filter(command: {
  date_range: CalendarDateRange;
  filter?: ActivityFilter;
  organization_id: ScalarValueInput<Activity["organization_id"]>;
}): ActivityFilter {
  return {
    ...command.filter,
    organization_id: command.organization_id,
    start_date_after: command.date_range.start_date,
    start_date_before: command.date_range.end_date,
  };
}

export function create_activity_categories_map(
  categories: ActivityCategory[],
): Map<ActivityCategory["id"], ActivityCategory> {
  return new Map<ActivityCategory["id"], ActivityCategory>(
    categories.map((category: ActivityCategory) => [category.id, category]),
  );
}

export function map_activities_to_calendar_events(
  activities: Activity[],
  categories_map: Map<ActivityCategory["id"], ActivityCategory>,
): CalendarEvent[] {
  return activities.map((activity: Activity) => {
    const category = categories_map.get(activity.category_id);
    return {
      id: activity.id,
      title: activity.title,
      start: activity.start_datetime,
      end: activity.end_datetime,
      all_day: activity.is_all_day,
      color:
        activity.color_override || category?.color || DEFAULT_ACTIVITY_COLOR,
      category_id: activity.category_id,
      category_name: category?.name || UNKNOWN_CATEGORY_NAME,
      category_type: activity.category_type,
      source_type: activity.source_type,
      is_editable: can_edit_activity(activity),
      is_deletable: can_delete_activity(activity),
      activity,
    };
  });
}
