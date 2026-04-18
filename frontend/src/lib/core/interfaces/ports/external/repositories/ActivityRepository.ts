import type {
  Activity,
  ActivitySourceType,
  ActivityStatus,
  CreateActivityInput,
  UpdateActivityInput,
} from "../../../../entities/Activity";
import type { ActivityCategoryType } from "../../../../entities/ActivityCategory";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

const ACTIVITY_NOT_FOUND_BY_SOURCE_ERROR_PREFIX = "Activity not found";

export function build_activity_not_found_by_source_error(
  source_type: ActivitySourceType,
  source_id: ScalarValueInput<Activity["source_id"]>,
): string {
  return `${ACTIVITY_NOT_FOUND_BY_SOURCE_ERROR_PREFIX}: source_type=${source_type}, source_id=${source_id}`;
}

export function is_activity_not_found_by_source_error(
  error: string,
  source_type: ActivitySourceType,
  source_id: ScalarValueInput<Activity["source_id"]>,
): boolean {
  return (
    error === build_activity_not_found_by_source_error(source_type, source_id)
  );
}

export interface ActivityFilter {
  title_contains?: string;
  organization_id?: ScalarValueInput<Activity["organization_id"]>;
  category_id?: ScalarValueInput<Activity["category_id"]>;
  category_type?: ActivityCategoryType;
  team_id?: ScalarValueInput<Activity["team_ids"][number]>;
  competition_id?: ScalarValueInput<Activity["competition_id"]>;
  fixture_id?: ScalarValueInput<Activity["fixture_id"]>;
  status?: ActivityStatus;
  source_type?: ActivitySourceType;
  start_date_after?: ScalarValueInput<Activity["start_datetime"]>;
  start_date_before?: ScalarValueInput<Activity["start_datetime"]>;
  is_all_day?: boolean;
}

export interface ActivityRepository extends FilterableRepository<
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilter
> {
  find_by_organization(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_date_range(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    start_date: ScalarValueInput<Activity["start_datetime"]>,
    end_date: ScalarValueInput<Activity["end_datetime"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_category(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    category_id: ScalarValueInput<Activity["category_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_team(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    team_id: ScalarValueInput<Activity["team_ids"][number]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_competition(
    competition_id: ScalarValueInput<Activity["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_source(
    source_type: ActivitySourceType,
    source_id: ScalarValueInput<Activity["source_id"]>,
  ): AsyncResult<Activity>;
}
