import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import {
  type Activity,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "../../core/entities/Activity";
import type {
  ActivityRepository,
  ActivityFilter,
} from "../../core/interfaces/adapters/ActivityRepository";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_activities";
const ENTITY_PREFIX = "activity";

export class InMemoryActivityRepository
  extends InMemoryBaseRepository<
    Activity,
    CreateActivityInput,
    UpdateActivityInput
  >
  implements ActivityRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateActivityInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Activity {
    return {
      id,
      ...timestamps,
      ...input,
      google_calendar_event_id: null,
      last_synced_at: null,
    };
  }

  protected apply_updates_to_entity(
    entity: Activity,
    updates: UpdateActivityInput,
  ): Activity {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: ActivityFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_activities = Array.from(this.entity_cache.values());

    if (filter.title_contains) {
      const search_term = filter.title_contains.toLowerCase();
      filtered_activities = filtered_activities.filter((activity) =>
        activity.title.toLowerCase().includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered_activities = filtered_activities.filter(
        (activity) => activity.organization_id === filter.organization_id,
      );
    }

    if (filter.category_id) {
      filtered_activities = filtered_activities.filter(
        (activity) => activity.category_id === filter.category_id,
      );
    }

    if (filter.category_type) {
      filtered_activities = filtered_activities.filter(
        (activity) => activity.category_type === filter.category_type,
      );
    }

    if (filter.team_id) {
      filtered_activities = filtered_activities.filter((activity) =>
        activity.team_ids.includes(filter.team_id!),
      );
    }

    if (filter.competition_id) {
      filtered_activities = filtered_activities.filter(
        (activity) => activity.competition_id === filter.competition_id,
      );
    }

    if (filter.fixture_id) {
      filtered_activities = filtered_activities.filter(
        (activity) => activity.fixture_id === filter.fixture_id,
      );
    }

    if (filter.status) {
      filtered_activities = filtered_activities.filter(
        (activity) => activity.status === filter.status,
      );
    }

    if (filter.source_type) {
      filtered_activities = filtered_activities.filter(
        (activity) => activity.source_type === filter.source_type,
      );
    }

    if (filter.start_date_after) {
      const after_date = new Date(filter.start_date_after);
      filtered_activities = filtered_activities.filter(
        (activity) => new Date(activity.start_datetime) >= after_date,
      );
    }

    if (filter.start_date_before) {
      const before_date = new Date(filter.start_date_before);
      filtered_activities = filtered_activities.filter(
        (activity) => new Date(activity.start_datetime) <= before_date,
      );
    }

    if (filter.is_all_day !== undefined) {
      filtered_activities = filtered_activities.filter(
        (activity) => activity.is_all_day === filter.is_all_day,
      );
    }

    if (filter.google_calendar_sync_enabled !== undefined) {
      filtered_activities = filtered_activities.filter(
        (activity) =>
          activity.google_calendar_sync_enabled ===
          filter.google_calendar_sync_enabled,
      );
    }

    const total_count = filtered_activities.length;
    const paginated_activities = this.apply_pagination_and_sort(
      filtered_activities,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_activities, total_count, options),
    );
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_by_filter({ organization_id }, options);
  }

  async find_by_date_range(
    organization_id: string,
    start_date: string,
    end_date: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_by_filter(
      {
        organization_id,
        start_date_after: start_date,
        start_date_before: end_date,
      },
      options,
    );
  }

  async find_by_category(
    organization_id: string,
    category_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_by_filter({ organization_id, category_id }, options);
  }

  async find_by_team(
    organization_id: string,
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_by_filter({ organization_id, team_id }, options);
  }

  async find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_by_filter({ competition_id }, options);
  }

  async find_by_source(
    source_type: Activity["source_type"],
    source_id: string,
  ): AsyncResult<Activity | null> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const activity = Array.from(this.entity_cache.values()).find(
      (a) => a.source_type === source_type && a.source_id === source_id,
    );

    return create_success_result(activity ?? null);
  }

  async find_activities_for_google_sync(
    organization_id: string,
  ): PaginatedAsyncResult<Activity> {
    return this.find_by_filter({
      organization_id,
      google_calendar_sync_enabled: true,
    });
  }
}

let repository_instance: InMemoryActivityRepository | null = null;

export function get_activity_repository(): ActivityRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryActivityRepository();
  }
  return repository_instance;
}

export function reset_activity_repository(): void {
  repository_instance = null;
}
