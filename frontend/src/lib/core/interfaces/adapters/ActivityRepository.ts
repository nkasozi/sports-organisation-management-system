import type { FilterableRepository, QueryOptions } from "./Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityStatus,
  ActivitySourceType,
} from "../../entities/Activity";
import type { ActivityCategoryType } from "../../entities/ActivityCategory";

export interface ActivityFilter {
  title_contains?: string;
  organization_id?: string;
  category_id?: string;
  category_type?: ActivityCategoryType;
  team_id?: string;
  competition_id?: string;
  fixture_id?: string;
  status?: ActivityStatus;
  source_type?: ActivitySourceType;
  start_date_after?: string;
  start_date_before?: string;
  is_all_day?: boolean;
  google_calendar_sync_enabled?: boolean;
}

export interface ActivityRepository extends FilterableRepository<
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilter
> {
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_date_range(
    organization_id: string,
    start_date: string,
    end_date: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_category(
    organization_id: string,
    category_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_team(
    organization_id: string,
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  find_by_source(
    source_type: ActivitySourceType,
    source_id: string,
  ): AsyncResult<Activity | null>;

  find_activities_for_google_sync(
    organization_id: string,
  ): PaginatedAsyncResult<Activity>;
}
