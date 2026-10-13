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
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  FILTER_RULE_ACTIVATION,
  predicate_rule,
  text_contains_rule,
} from "./InBrowserRepositoryFilterRules";
import {
  create_warning_failure_details,
  run_repository_query,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";

const ENTITY_PREFIX = "activity";

const ACTIVITY_FILTER_RULES: EntityFilterRule<Activity, ActivityFilter>[] = [
  text_contains_rule("title_contains", (activity) => activity.title),
  equals_rule("organization_id"),
  equals_rule("category_id"),
  equals_rule("category_type"),
  predicate_rule("team_id", (activity, filter) =>
    activity.team_ids.some((team_id) => team_id === filter.team_id),
  ),
  equals_rule("competition_id"),
  equals_rule("fixture_id"),
  equals_rule("status"),
  equals_rule("source_type"),
  predicate_rule(
    "start_date_after",
    (activity, filter) =>
      new Date(activity.start_datetime) >=
      new Date(filter.start_date_after as string),
  ),
  predicate_rule(
    "start_date_before",
    (activity, filter) =>
      new Date(activity.start_datetime) <=
      new Date(filter.start_date_before as string),
  ),
  equals_rule("is_all_day", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
];

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
    return apply_entity_filter_rules(entities, filter, ACTIVITY_FILTER_RULES);
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
    return run_repository_query(
      create_warning_failure_details(
        "[ActivityRepository] Failed to find activity by source",
        "repository_find_activity_by_source_failed",
        "find activity by source",
      ),
      async () => {
        const matched_activity = (
          await this.database.activities.toArray()
        ).find(
          (activity) =>
            activity.source_type === source_type &&
            activity.source_id === source_id,
        );
        return matched_activity
          ? create_success_result(matched_activity)
          : create_failure_result(
              build_activity_not_found_by_source_error(source_type, source_id),
            );
      },
    );
  }
}

export const get_activity_repository: () => ActivityRepository =
  create_lazy_repository_accessor(() => new InBrowserActivityRepository());
