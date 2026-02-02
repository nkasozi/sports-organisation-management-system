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
} from "../../core/interfaces/adapters/ActivityRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
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

export class InBrowserActivityRepository
  extends InBrowserBaseRepository<
    Activity,
    CreateActivityInput,
    UpdateActivityInput
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
    try {
      let filtered_entities = await this.database.activities.toArray();

      if (filter.title_contains) {
        const search_term = filter.title_contains.toLowerCase();
        filtered_entities = filtered_entities.filter((activity) =>
          activity.title.toLowerCase().includes(search_term),
        );
      }

      if (filter.organization_id) {
        filtered_entities = filtered_entities.filter(
          (activity) => activity.organization_id === filter.organization_id,
        );
      }

      if (filter.category_id) {
        filtered_entities = filtered_entities.filter(
          (activity) => activity.category_id === filter.category_id,
        );
      }

      if (filter.category_type) {
        filtered_entities = filtered_entities.filter(
          (activity) => activity.category_type === filter.category_type,
        );
      }

      if (filter.team_id) {
        filtered_entities = filtered_entities.filter((activity) =>
          activity.team_ids.includes(filter.team_id!),
        );
      }

      if (filter.competition_id) {
        filtered_entities = filtered_entities.filter(
          (activity) => activity.competition_id === filter.competition_id,
        );
      }

      if (filter.fixture_id) {
        filtered_entities = filtered_entities.filter(
          (activity) => activity.fixture_id === filter.fixture_id,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (activity) => activity.status === filter.status,
        );
      }

      if (filter.source_type) {
        filtered_entities = filtered_entities.filter(
          (activity) => activity.source_type === filter.source_type,
        );
      }

      if (filter.start_date_after) {
        const after_date = new Date(filter.start_date_after);
        filtered_entities = filtered_entities.filter(
          (activity) => new Date(activity.start_datetime) >= after_date,
        );
      }

      if (filter.start_date_before) {
        const before_date = new Date(filter.start_date_before);
        filtered_entities = filtered_entities.filter(
          (activity) => new Date(activity.start_datetime) <= before_date,
        );
      }

      if (filter.is_all_day !== undefined) {
        filtered_entities = filtered_entities.filter(
          (activity) => activity.is_all_day === filter.is_all_day,
        );
      }

      if (filter.google_calendar_sync_enabled !== undefined) {
        filtered_entities = filtered_entities.filter(
          (activity) =>
            activity.google_calendar_sync_enabled ===
            filter.google_calendar_sync_enabled,
        );
      }

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter activities: ${error_message}`,
      );
    }
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

  async find_activities_for_google_sync(
    organization_id: string,
  ): PaginatedAsyncResult<Activity> {
    return this.find_by_filter({
      organization_id,
      google_calendar_sync_enabled: true,
    });
  }
}

export function create_default_activities(): Activity[] {
  const now = new Date().toISOString();

  return [
    {
      id: "activity_default_1",
      title: "Team Training Session",
      description: "Regular weekly training session for all team members",
      organization_id: "org_default_1",
      category_id: "activity_category_training",
      category_type: "training",
      start_datetime: new Date(Date.now() + 86400000).toISOString(),
      end_datetime: new Date(Date.now() + 86400000 + 7200000).toISOString(),
      is_all_day: false,
      location: "Lugogo Hockey Stadium",
      venue_id: "venue_default_1",
      team_ids: ["team_default_1"],
      competition_id: null,
      fixture_id: null,
      source_type: "manual",
      source_id: null,
      status: "scheduled",
      recurrence: {
        pattern: "weekly",
        interval: 1,
        end_date: null,
        days_of_week: [2, 4],
      },
      reminders: [
        { id: "reminder_1_day", minutes_before: 1440, is_enabled: true },
        { id: "reminder_1_hour", minutes_before: 60, is_enabled: false },
      ],
      color_override: null,
      google_calendar_event_id: null,
      google_calendar_sync_enabled: false,
      last_synced_at: null,
      notes: "Bring all necessary equipment",
      created_at: now,
      updated_at: now,
    },
    {
      id: "activity_default_2",
      title: "Team Meeting",
      description: "Monthly team strategy and review meeting",
      organization_id: "org_default_1",
      category_id: "activity_category_meeting",
      category_type: "meeting",
      start_datetime: new Date(Date.now() + 172800000).toISOString(),
      end_datetime: new Date(Date.now() + 172800000 + 3600000).toISOString(),
      is_all_day: false,
      location: "Conference Room A",
      venue_id: null,
      team_ids: ["team_default_1"],
      competition_id: null,
      fixture_id: null,
      source_type: "manual",
      source_id: null,
      status: "scheduled",
      recurrence: null,
      reminders: [
        { id: "reminder_1_day", minutes_before: 1440, is_enabled: true },
      ],
      color_override: null,
      google_calendar_event_id: null,
      google_calendar_sync_enabled: false,
      last_synced_at: null,
      notes: "Agenda will be shared via email",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserActivityRepository | null = null;

export function get_activity_repository(): ActivityRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserActivityRepository();
  }
  return singleton_instance;
}

export async function initialize_activity_repository(): Promise<void> {
  const repository = get_activity_repository() as InBrowserActivityRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_activities());
  }
}

export async function reset_activity_repository(): Promise<void> {
  const repository = get_activity_repository() as InBrowserActivityRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_activities());
}
