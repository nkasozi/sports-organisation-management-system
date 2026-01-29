import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ActivitySourceType,
} from "../../entities/Activity";
import type { ActivityFilter } from "../adapters/ActivityRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type {
  BaseUseCasesPort,
  EntityOperationResult,
} from "./BaseUseCasesPort";

export interface CalendarDateRange {
  start_date: string;
  end_date: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  all_day: boolean;
  color: string;
  category_id: string;
  category_name: string;
  category_type: string;
  source_type: ActivitySourceType;
  is_editable: boolean;
  is_deletable: boolean;
  activity: Activity;
}

export interface ActivityUseCasesPort extends BaseUseCasesPort<
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilter
> {
  list_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Activity>>;

  list_by_date_range(
    organization_id: string,
    date_range: CalendarDateRange,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Activity>>;

  list_by_category(
    organization_id: string,
    category_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Activity>>;

  list_by_team(
    organization_id: string,
    team_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Activity>>;

  list_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Activity>>;

  get_calendar_events(
    organization_id: string,
    date_range: CalendarDateRange,
    filter?: ActivityFilter,
  ): Promise<EntityOperationResult<CalendarEvent[]>>;

  sync_competitions_to_activities(
    organization_id: string,
  ): Promise<EntityOperationResult<{ created: number; updated: number }>>;

  sync_fixtures_to_activities(
    organization_id: string,
    competition_id?: string,
  ): Promise<EntityOperationResult<{ created: number; updated: number }>>;

  find_activity_by_source(
    source_type: ActivitySourceType,
    source_id: string,
  ): Promise<EntityOperationResult<Activity | null>>;
}
