import type { Activity } from "../entities/Activity";
import type { ActivityCategory } from "../entities/ActivityCategory";
import type {
  ActivityCategoryRepository,
  ActivityFilter,
  ActivityRepository,
  CalendarDateRange,
  CalendarEvent,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import {
  build_activity_date_range_filter,
  create_activity_categories_map,
  map_activities_to_calendar_events,
} from "./ActivityCalendarEventMapping";
import {
  ACTIVITY_EVENT,
  ACTIVITY_LOG_SCOPE,
  CALENDAR_EVENT_PAGE_SIZE,
} from "./ActivityUseCaseConstants";
import {
  create_log_target_builder,
  relay_repository_failure,
} from "./FailureRelay";

type OrganizationId = ScalarValueInput<Activity["organization_id"]>;

interface CalendarEventQuery {
  organization_id: OrganizationId;
  date_range: CalendarDateRange;
  filter?: ActivityFilter;
}

const log_target = create_log_target_builder(ACTIVITY_LOG_SCOPE);

async function load_calendar_categories(
  category_repository: ActivityCategoryRepository,
  organization_id: OrganizationId,
): Promise<ActivityCategory[]> {
  const categories_result =
    await category_repository.find_by_organization(organization_id);
  if (categories_result.success) return categories_result.data.items;
  console.warn(ACTIVITY_LOG_SCOPE, {
    event: ACTIVITY_EVENT.CALENDAR_CATEGORIES_UNAVAILABLE,
    organization_id,
    technical_detail: categories_result.error,
  });
  return [];
}

export async function load_calendar_events(
  activity_repository: ActivityRepository,
  category_repository: ActivityCategoryRepository,
  query: CalendarEventQuery,
): AsyncResult<CalendarEvent[]> {
  const activities_result = await activity_repository.find_all(
    build_activity_date_range_filter(query),
    { page_size: CALENDAR_EVENT_PAGE_SIZE },
  );
  if (!activities_result.success)
    return relay_repository_failure(
      log_target(ACTIVITY_EVENT.CALENDAR_ACTIVITIES_FAILED, {
        organization_id: query.organization_id,
      }),
      activities_result.error,
    );
  const categories = await load_calendar_categories(
    category_repository,
    query.organization_id,
  );
  return create_success_result(
    map_activities_to_calendar_events(
      activities_result.data.items,
      create_activity_categories_map(categories),
    ),
  );
}
