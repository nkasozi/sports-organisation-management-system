import type { Table } from "dexie";
import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
} from "../../core/entities/Activity";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  ActivityRepository,
  ActivityFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "activity";

class InBrowserActivityRepository
  extends InBrowserBaseRepository<
    Activity,
    CreateActivityInput,
    UpdateActivityInput,
    ActivityFilter
  >
  implements ActivityRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Activity, string> {
    return this.database.activities;
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

  protected apply_entity_filter(
    entities: Activity[],
    filter: ActivityFilter,
  ): Activity[] {
    let filtered = entities;

    if (filter.title_contains) {
      const search_term = filter.title_contains.toLowerCase();
      filtered = filtered.filter((activity) =>
        activity.title.toLowerCase().includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered = filtered.filter(
        (activity) => activity.organization_id === filter.organization_id,
      );
    }

    if (filter.category_id) {
      filtered = filtered.filter(
        (activity) => activity.category_id === filter.category_id,
      );
    }

    if (filter.category_type) {
      filtered = filtered.filter(
        (activity) => activity.category_type === filter.category_type,
      );
    }

    if (filter.team_id) {
      filtered = filtered.filter((activity) =>
        activity.team_ids.includes(filter.team_id!),
      );
    }

    if (filter.competition_id) {
      filtered = filtered.filter(
        (activity) => activity.competition_id === filter.competition_id,
      );
    }

    if (filter.fixture_id) {
      filtered = filtered.filter(
        (activity) => activity.fixture_id === filter.fixture_id,
      );
    }

    if (filter.status) {
      filtered = filtered.filter(
        (activity) => activity.status === filter.status,
      );
    }

    if (filter.source_type) {
      filtered = filtered.filter(
        (activity) => activity.source_type === filter.source_type,
      );
    }

    if (filter.start_date_after) {
      const after_date = new Date(filter.start_date_after);
      filtered = filtered.filter(
        (activity) => new Date(activity.start_datetime) >= after_date,
      );
    }

    if (filter.start_date_before) {
      const before_date = new Date(filter.start_date_before);
      filtered = filtered.filter(
        (activity) => new Date(activity.start_datetime) <= before_date,
      );
    }

    if (filter.is_all_day !== undefined) {
      filtered = filtered.filter(
        (activity) => activity.is_all_day === filter.is_all_day,
      );
    }

    return filtered;
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_all({ organization_id }, options);
  }

  async find_by_date_range(
    organization_id: string,
    start_date: string,
    end_date: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_all(
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
    return this.find_all({ organization_id, category_id }, options);
  }

  async find_by_team(
    organization_id: string,
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_all({ organization_id, team_id }, options);
  }

  async find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_all({ competition_id }, options);
  }

  async find_by_source(
    source_type: Activity["source_type"],
    source_id: string,
  ): AsyncResult<Activity | null> {
    try {
      const all_activities = await this.database.activities.toArray();
      const activity = all_activities.find(
        (a) => a.source_type === source_type && a.source_id === source_id,
      );
      return create_success_result(activity ?? null);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find activity by source: ${error_message}`,
      );
    }
  }
}

let singleton_instance: InBrowserActivityRepository | null = null;

export function get_activity_repository(): ActivityRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserActivityRepository();
  }
  return singleton_instance;
}
