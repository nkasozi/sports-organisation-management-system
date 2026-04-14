import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
} from "../entities/Activity";
import {
  can_delete_activity,
  can_edit_activity,
  validate_activity_input,
} from "../entities/Activity";
import type {
  ActivityCategoryRepository,
  ActivityFilter,
  ActivityRepository,
  ActivityUseCasesPort,
  CalendarDateRange,
  CalendarEvent,
  CompetitionRepository,
  FixtureRepository,
  QueryOptions,
  TeamRepository,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import {
  build_activity_date_range_filter,
  create_activity_categories_map,
  map_activities_to_calendar_events,
} from "./ActivityCalendarEventMapping";
import { create_activity_sync } from "./ActivitySyncUseCases";

type ActivityUseCases = ActivityUseCasesPort;

interface ActivityUseCasesDependencies {
  activity_repository: ActivityRepository;
  activity_category_repository: ActivityCategoryRepository;
  competition_repository: CompetitionRepository;
  fixture_repository: FixtureRepository;
  team_repository: TeamRepository;
}

export function create_activity_use_cases(
  dependencies: ActivityUseCasesDependencies,
): ActivityUseCases {
  const {
    activity_repository,
    activity_category_repository,
    competition_repository,
    fixture_repository,
    team_repository,
  } = dependencies;

  return {
    async list(
      filter?: ActivityFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      return activity_repository.find_all(filter, options);
    },

    async get_by_id(id: Activity["id"]): AsyncResult<Activity> {
      if (!id?.trim()) return create_failure_result("Activity ID is required");
      return activity_repository.find_by_id(id);
    },

    async create(input: CreateActivityInput): AsyncResult<Activity> {
      const validation = validate_activity_input(input);
      if (!validation.is_valid)
        return create_failure_result(
          Object.values(validation.errors).join(", "),
        );
      return activity_repository.create(input);
    },

    async update(
      id: Activity["id"],
      input: UpdateActivityInput,
    ): AsyncResult<Activity> {
      if (!id?.trim()) return create_failure_result("Activity ID is required");
      const existing_result = await activity_repository.find_by_id(id);
      if (!existing_result.success)
        return create_failure_result(existing_result.error);
      if (!can_edit_activity(existing_result.data!))
        return create_failure_result(
          "Cannot edit activities auto-generated from competitions or fixtures",
        );
      return activity_repository.update(id, input);
    },

    async delete(id: Activity["id"]): AsyncResult<boolean> {
      if (!id?.trim()) return create_failure_result("Activity ID is required");
      const existing_result = await activity_repository.find_by_id(id);
      if (!existing_result.success)
        return create_failure_result(existing_result.error);
      if (!can_delete_activity(existing_result.data!))
        return create_failure_result(
          "Cannot delete activities auto-generated from competitions or fixtures",
        );
      return activity_repository.delete_by_id(id);
    },

    async list_by_organization(
      organization_id: ScalarValueInput<Activity["organization_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      if (!organization_id?.trim())
        return { success: false, error: "Organization ID is required" };
      return activity_repository.find_by_organization(organization_id, options);
    },

    async list_by_date_range(
      organization_id: ScalarValueInput<Activity["organization_id"]>,
      date_range: CalendarDateRange,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      if (!organization_id?.trim())
        return { success: false, error: "Organization ID is required" };
      return activity_repository.find_by_date_range(
        organization_id,
        date_range.start_date,
        date_range.end_date,
        options,
      );
    },

    async list_by_category(
      organization_id: ScalarValueInput<Activity["organization_id"]>,
      category_id: ScalarValueInput<Activity["category_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      return activity_repository.find_by_category(
        organization_id,
        category_id,
        options,
      );
    },

    async list_by_team(
      organization_id: ScalarValueInput<Activity["organization_id"]>,
      team_id: ScalarValueInput<Activity["team_ids"][number]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      return activity_repository.find_by_team(
        organization_id,
        team_id,
        options,
      );
    },

    async list_by_competition(
      competition_id: ScalarValueInput<Activity["competition_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      return activity_repository.find_by_competition(competition_id, options);
    },

    async get_calendar_events(
      organization_id: ScalarValueInput<Activity["organization_id"]>,
      date_range: CalendarDateRange,
      filter?: ActivityFilter,
    ): AsyncResult<CalendarEvent[]> {
      const combined_filter = build_activity_date_range_filter({
        date_range,
        filter,
        organization_id,
      });
      const activities_result = await activity_repository.find_all(
        combined_filter,
        { page_size: 1000 },
      );
      if (!activities_result.success)
        return create_failure_result(activities_result.error);
      const activities = activities_result.data?.items || [];
      const categories_result =
        await activity_category_repository.find_by_organization(
          organization_id,
        );
      const category_items =
        categories_result.success && categories_result.data
          ? categories_result.data.items
          : [];
      const categories_map = create_activity_categories_map(category_items);
      return create_success_result(
        map_activities_to_calendar_events(activities, categories_map),
      );
    },

    ...create_activity_sync(
      activity_repository,
      activity_category_repository,
      competition_repository,
      fixture_repository,
      team_repository,
    ),
  };
}
