import type {
  Activity,
  ActivitySourceType,
  CreateActivityInput,
  UpdateActivityInput,
} from "../../../../entities/Activity";
import type { ActivityCategory } from "../../../../entities/ActivityCategory";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { ActivityFilter } from "../../external/repositories/ActivityRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface CalendarDateRange {
  start_date: ScalarValueInput<Activity["start_datetime"]>;
  end_date: ScalarValueInput<Activity["end_datetime"]>;
}

export interface CalendarEvent {
  id: Activity["id"];
  title: Activity["title"];
  start: Activity["start_datetime"];
  end: Activity["end_datetime"];
  all_day: boolean;
  color: string;
  category_id: Activity["category_id"];
  category_name: string;
  category_type: ActivityCategory["category_type"];
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
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  list_by_date_range(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    date_range: CalendarDateRange,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  list_by_category(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    category_id: ScalarValueInput<Activity["category_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  list_by_team(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    team_id: ScalarValueInput<Activity["team_ids"][number]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  list_by_competition(
    competition_id: ScalarValueInput<Activity["competition_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Activity>;

  get_calendar_events(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    date_range: CalendarDateRange,
    filter?: ActivityFilter,
  ): AsyncResult<CalendarEvent[]>;

  sync_competitions_to_activities(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
  ): AsyncResult<{ created: number; updated: number }>;

  sync_fixtures_to_activities(
    organization_id: ScalarValueInput<Activity["organization_id"]>,
    competition_id?: ScalarValueInput<Activity["competition_id"]>,
  ): AsyncResult<{ created: number; updated: number }>;

  find_activity_by_source(
    source_type: ActivitySourceType,
    source_id: ScalarValueInput<Activity["source_id"]>,
  ): AsyncResult<Activity>;
}
