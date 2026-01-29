import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
} from "../entities/Activity";
import {
  validate_activity_input,
  create_activity_from_fixture,
  create_activity_from_competition,
  can_edit_activity,
  can_delete_activity,
} from "../entities/Activity";
import type { ActivityCategory } from "../entities/ActivityCategory";
import type {
  ActivityRepository,
  ActivityFilter,
} from "../interfaces/adapters/ActivityRepository";
import type { CompetitionRepository } from "../interfaces/adapters/CompetitionRepository";
import type { FixtureRepository } from "../interfaces/adapters/FixtureRepository";
import type { TeamRepository } from "../interfaces/adapters/TeamRepository";
import type { ActivityCategoryRepository } from "../interfaces/adapters/ActivityCategoryRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type {
  ActivityUseCasesPort,
  CalendarDateRange,
  CalendarEvent,
} from "../interfaces/ports/ActivityUseCasesPort";
import { get_repository_container } from "../../infrastructure/container";

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

  async function get_or_create_fixture_category(
    organization_id: string,
  ): Promise<string | null> {
    const categories_result =
      await activity_category_repository.find_by_category_type(
        organization_id,
        "fixture",
      );

    if (
      categories_result.success &&
      categories_result.data?.items &&
      categories_result.data.items.length > 0
    ) {
      return categories_result.data.items[0].id;
    }

    return null;
  }

  async function get_or_create_competition_category(
    organization_id: string,
  ): Promise<string | null> {
    const categories_result =
      await activity_category_repository.find_by_category_type(
        organization_id,
        "competition",
      );

    if (
      categories_result.success &&
      categories_result.data?.items &&
      categories_result.data.items.length > 0
    ) {
      return categories_result.data.items[0].id;
    }

    return null;
  }

  return {
    async list(
      filter?: ActivityFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<Activity>> {
      const result = filter
        ? await activity_repository.find_by_filter(filter, options)
        : await activity_repository.find_all(options);

      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }

      return {
        success: true,
        data: result.data?.items || [],
        total_count: result.data?.total_count || 0,
      };
    },

    async get_by_id(id: string): Promise<EntityOperationResult<Activity>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Activity ID is required" };
      }

      const result = await activity_repository.find_by_id(id);

      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async create(
      input: CreateActivityInput,
    ): Promise<EntityOperationResult<Activity>> {
      const validation = validate_activity_input(input);

      if (!validation.is_valid) {
        const error_messages = Object.values(validation.errors).join(", ");
        return { success: false, error_message: error_messages };
      }

      const result = await activity_repository.create(input);

      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdateActivityInput,
    ): Promise<EntityOperationResult<Activity>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Activity ID is required" };
      }

      const existing_result = await activity_repository.find_by_id(id);

      if (!existing_result.success) {
        return { success: false, error_message: existing_result.error };
      }

      if (!can_edit_activity(existing_result.data!)) {
        return {
          success: false,
          error_message:
            "Cannot edit activities auto-generated from competitions or fixtures",
        };
      }

      const result = await activity_repository.update(id, input);

      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Activity ID is required" };
      }

      const existing_result = await activity_repository.find_by_id(id);

      if (!existing_result.success) {
        return { success: false, error_message: existing_result.error };
      }

      if (!can_delete_activity(existing_result.data!)) {
        return {
          success: false,
          error_message:
            "Cannot delete activities auto-generated from competitions or fixtures",
        };
      }

      const result = await activity_repository.delete_by_id(id);

      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async list_by_organization(
      organization_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Activity>> {
      if (!organization_id || organization_id.trim().length === 0) {
        return { success: false, error: "Organization ID is required" };
      }

      return activity_repository.find_by_organization(organization_id, options);
    },

    async list_by_date_range(
      organization_id: string,
      date_range: CalendarDateRange,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Activity>> {
      if (!organization_id || organization_id.trim().length === 0) {
        return { success: false, error: "Organization ID is required" };
      }

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
    ): Promise<PaginatedAsyncResult<Activity>> {
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
    ): Promise<PaginatedAsyncResult<Activity>> {
      return activity_repository.find_by_team(
        organization_id,
        team_id,
        options,
      );
    },

    async list_by_competition(
      competition_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<Activity>> {
      return activity_repository.find_by_competition(competition_id, options);
    },

    async get_calendar_events(
      organization_id: string,
      date_range: CalendarDateRange,
      filter?: ActivityFilter,
    ): Promise<EntityOperationResult<CalendarEvent[]>> {
      const combined_filter: ActivityFilter = {
        ...filter,
        organization_id,
        start_date_after: date_range.start_date,
        start_date_before: date_range.end_date,
      };

      const activities_result = await activity_repository.find_by_filter(
        combined_filter,
        { page_size: 1000 },
      );

      if (!activities_result.success) {
        return { success: false, error_message: activities_result.error };
      }

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

      return { success: true, data: calendar_events };
    },

    async sync_competitions_to_activities(
      organization_id: string,
    ): Promise<EntityOperationResult<{ created: number; updated: number }>> {
      const competition_category_id =
        await get_or_create_competition_category(organization_id);

      if (!competition_category_id) {
        return {
          success: false,
          error_message:
            "Competition category not found. Please ensure default categories are created.",
        };
      }

      const competitions_result =
        await competition_repository.find_by_organization(organization_id);

      if (!competitions_result.success) {
        return { success: false, error_message: competitions_result.error };
      }

      const competitions = competitions_result.data?.items || [];
      let created = 0;
      let updated = 0;

      for (const competition of competitions) {
        const existing_activity_result =
          await activity_repository.find_by_source(
            "competition",
            competition.id,
          );

        if (!existing_activity_result.success) {
          continue;
        }

        const activity_input = create_activity_from_competition(
          competition.id,
          competition.name,
          competition.start_date,
          competition.end_date,
          organization_id,
          competition_category_id,
          competition.location,
        );

        if (existing_activity_result.data) {
          const update_result = await activity_repository.update(
            existing_activity_result.data.id,
            {
              title: activity_input.title,
              start_datetime: activity_input.start_datetime,
              end_datetime: activity_input.end_datetime,
              location: activity_input.location,
            },
          );

          if (update_result.success) {
            updated++;
          }
        } else {
          const create_result =
            await activity_repository.create(activity_input);

          if (create_result.success) {
            created++;
          }
        }
      }

      return { success: true, data: { created, updated } };
    },

    async sync_fixtures_to_activities(
      organization_id: string,
      competition_id?: string,
    ): Promise<EntityOperationResult<{ created: number; updated: number }>> {
      console.log(
        "[ActivityUseCases] sync_fixtures_to_activities - org:",
        organization_id,
        "competition:",
        competition_id,
      );

      const fixture_category_id =
        await get_or_create_fixture_category(organization_id);

      if (!fixture_category_id) {
        console.log("[ActivityUseCases] No fixture category found");
        return {
          success: false,
          error_message:
            "Fixture category not found. Please ensure default categories are created.",
        };
      }

      const fixtures_result = competition_id
        ? await fixture_repository.find_by_competition(competition_id)
        : await fixture_repository.find_all({ page_size: 1000 });

      if (!fixtures_result.success) {
        console.log(
          "[ActivityUseCases] Failed to fetch fixtures:",
          fixtures_result.error,
        );
        return { success: false, error_message: fixtures_result.error };
      }

      console.log(
        "[ActivityUseCases] Fixtures found - count:",
        fixtures_result.data?.items?.length,
      );

      const fixtures = fixtures_result.data?.items || [];
      let created = 0;
      let updated = 0;

      for (const fixture of fixtures) {
        const existing_activity_result =
          await activity_repository.find_by_source("fixture", fixture.id);

        if (!existing_activity_result.success) {
          continue;
        }

        const home_team_result = await team_repository.find_by_id(
          fixture.home_team_id,
        );
        const away_team_result = await team_repository.find_by_id(
          fixture.away_team_id,
        );

        const home_team_name = home_team_result.success
          ? home_team_result.data?.name || "TBD"
          : "TBD";
        const away_team_name = away_team_result.success
          ? away_team_result.data?.name || "TBD"
          : "TBD";

        const fixture_title = `${home_team_name} vs ${away_team_name}`;
        const fixture_datetime = `${fixture.scheduled_date}T${fixture.scheduled_time || "00:00"}`;

        const activity_input = create_activity_from_fixture(
          fixture.id,
          fixture_title,
          fixture_datetime,
          fixture.competition_id,
          fixture.home_team_id,
          fixture.away_team_id,
          organization_id,
          fixture_category_id,
          fixture.venue,
        );

        if (existing_activity_result.data) {
          const update_result = await activity_repository.update(
            existing_activity_result.data.id,
            {
              title: activity_input.title,
              start_datetime: activity_input.start_datetime,
              end_datetime: activity_input.end_datetime,
              location: activity_input.location,
              team_ids: activity_input.team_ids,
            },
          );

          if (update_result.success) {
            updated++;
          }
        } else {
          const create_result =
            await activity_repository.create(activity_input);

          if (create_result.success) {
            created++;
          }
        }
      }

      return { success: true, data: { created, updated } };
    },

    async find_activity_by_source(
      source_type: Activity["source_type"],
      source_id: string,
    ): Promise<EntityOperationResult<Activity | null>> {
      const result = await activity_repository.find_by_source(
        source_type,
        source_id,
      );

      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },
  };
}

export function get_activity_use_cases(): ActivityUseCases {
  const container = get_repository_container();
  return create_activity_use_cases({
    activity_repository: container.activity_repository,
    activity_category_repository: container.activity_category_repository,
    competition_repository: container.competition_repository,
    fixture_repository: container.fixture_repository,
    team_repository: container.team_repository,
  });
}
