import type { Table } from "dexie";

import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
} from "../../core/entities/Activity";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  ActivityFilter,
  ActivityRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import { build_activity_not_found_by_source_error } from "../../core/interfaces/ports/external/repositories/ActivityRepository";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
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
    id: Activity["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Activity {
    return { id: id as Activity["id"], ...timestamps, ...input } as Activity;
  }

  protected apply_updates_to_entity(
    entity: Activity,
    updates: UpdateActivityInput,
  ): Activity {
    return { ...entity, ...updates } as Activity;
  }

  protected apply_entity_filter(
    entities: Activity[],
    filter: ActivityFilter,
  ): Activity[] {
    let filtered = entities;
    if (filter.title_contains) {
      const term = filter.title_contains.toLowerCase();
      filtered = filtered.filter((a) => a.title.toLowerCase().includes(term));
    }
    if (filter.organization_id) {
      filtered = filtered.filter(
        (a) => a.organization_id === filter.organization_id,
      );
    }
    if (filter.category_id) {
      filtered = filtered.filter((a) => a.category_id === filter.category_id);
    }
    if (filter.category_type) {
      filtered = filtered.filter(
        (a) => a.category_type === filter.category_type,
      );
    }
    if (filter.team_id) {
      filtered = filtered.filter((activity) =>
        activity.team_ids.some((team_id) => team_id === filter.team_id),
      );
    }
    if (filter.competition_id) {
      filtered = filtered.filter(
        (a) => a.competition_id === filter.competition_id,
      );
    }
    if (filter.fixture_id) {
      filtered = filtered.filter((a) => a.fixture_id === filter.fixture_id);
    }
    if (filter.status) {
      filtered = filtered.filter((a) => a.status === filter.status);
    }
    if (filter.source_type) {
      filtered = filtered.filter((a) => a.source_type === filter.source_type);
    }
    if (filter.start_date_after) {
      const after = new Date(filter.start_date_after);
      filtered = filtered.filter((a) => new Date(a.start_datetime) >= after);
    }
    if (filter.start_date_before) {
      const before = new Date(filter.start_date_before);
      filtered = filtered.filter((a) => new Date(a.start_datetime) <= before);
    }
    if ("is_all_day" in filter) {
      filtered = filtered.filter((a) => a.is_all_day === filter.is_all_day);
    }
    return filtered;
  }

  async find_by_organization(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_all({ organization_id }, options);
  }

  async find_by_date_range(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    start_date: ScalarValueInput<Activity["start_datetime"]>,
    end_date: ScalarValueInput<Activity["end_datetime"]>,
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
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    category_id: ScalarValueInput<Activity["category_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_all({ organization_id, category_id }, options);
  }

  async find_by_team(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    team_id: ScalarValueInput<Activity["team_ids"][number]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_all({ organization_id, team_id }, options);
  }

  async find_by_competition(
    competition_id: ScalarValueInput<Activity["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity> {
    return this.find_all({ competition_id }, options);
  }

  async find_by_source(
    source_type: Activity["source_type"],
    source_id: ScalarValueInput<Activity["source_id"]>,
  ): AsyncResult<Activity> {
    try {
      const all = await this.database.activities.toArray();
      const matched_activity = all.find(
        (activity) =>
          activity.source_type === source_type &&
          activity.source_id === source_id,
      );

      if (!matched_activity) {
        return create_failure_result(
          build_activity_not_found_by_source_error(source_type, source_id),
        );
      }

      return create_success_result(matched_activity);
    } catch (error) {
      console.warn("[ActivityRepository] Failed to find activity by source", {
        event: "repository_find_activity_by_source_failed",
        error: String(error),
      });
      const msg =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to find activity by source: ${msg}`);
    }
  }
}

type ActivityRepositoryState =
  | { status: "uninitialized" }
  | {
      status: "ready";
      repository: InBrowserActivityRepository;
    };

let activity_repository_state: ActivityRepositoryState = {
  status: "uninitialized",
};

export function get_activity_repository(): ActivityRepository {
  if (activity_repository_state.status === "ready") {
    return activity_repository_state.repository;
  }

  const repository = new InBrowserActivityRepository();
  activity_repository_state = { status: "ready", repository };

  return repository;
}
