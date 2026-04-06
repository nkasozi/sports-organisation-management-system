import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
} from "../entities/Activity";
import {
  validate_activity_input,
  can_edit_activity,
  can_delete_activity,
} from "../entities/Activity";
import type { ActivityCategory } from "../entities/ActivityCategory";
import type {
  ActivityRepository,
  ActivityFilter,
  ActivityCategoryRepository,
  CompetitionRepository,
  FixtureRepository,
  TeamRepository,
  QueryOptions,
  ActivityUseCasesPort,
  CalendarDateRange,
  CalendarEvent,
} from "../interfaces/ports";
import type { PaginatedAsyncResult, AsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import { create_activity_sync } from "./ActivitySyncUseCases";

export type ActivityUseCases = ActivityUseCasesPort;

export interface ActivityUseCasesDependencies {
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

    async get_by_id(id: string): AsyncResult<Activity> {
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
      id: string,
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

    async delete(id: string): AsyncResult<boolean> {
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
      organization_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      if (!organization_id?.trim())
        return { success: false, error: "Organization ID is required" };
      return activity_repository.find_by_organization(organization_id, options);
    },

    async list_by_date_range(
      organization_id: string,
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
      organization_id: string,
      category_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      return activity_repository.find_by_category(
        organization_id,
        category_id,
        options,
      );
    },

    async list_by_team(
      organization_id: string,
      team_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      return activity_repository.find_by_team(
        organization_id,
        team_id,
        options,
      );
    },

    async list_by_competition(
      competition_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<Activity> {
      return activity_repository.find_by_competition(competition_id, options);
    },

    async get_calendar_events(
      organization_id: string,
      date_range: CalendarDateRange,
      filter?: ActivityFilter,
    ): AsyncResult<CalendarEvent[]> {
      const combined_filter: ActivityFilter = {
        ...filter,
        organization_id,
        start_date_after: date_range.start_date,
        start_date_before: date_range.end_date,
      };
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
      const categories_map = new Map<string, ActivityCategory>(
        category_items.map((c) => [c.id, c]),
      );
      const calendar_events: CalendarEvent[] = activities.map((activity) => {
        const category = categories_map.get(activity.category_id);
        return {
          id: activity.id,
          title: activity.title,
          start: activity.start_datetime,
          end: activity.end_datetime,
          all_day: activity.is_all_day,
          color: activity.color_override || category?.color || "#3B82F6",
          category_id: activity.category_id,
          category_name: category?.name || "Unknown",
          category_type: activity.category_type,
          source_type: activity.source_type,
          is_editable: can_edit_activity(activity),
          is_deletable: can_delete_activity(activity),
          activity,
        };
      });
      return create_success_result(calendar_events);
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
