import type { FilterableRepository, QueryOptions } from "./Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type {
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
  CalendarFeedType,
} from "../../entities/CalendarToken";

export interface CalendarTokenFilter {
  user_id?: string;
  organization_id?: string;
  feed_type?: CalendarFeedType;
  entity_id?: string;
  is_active?: boolean;
}

export interface CalendarTokenRepository extends FilterableRepository<
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
  CalendarTokenFilter
> {
  find_by_token(token: string): AsyncResult<CalendarToken | null>;

  find_by_user(
    user_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken>;

  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken>;

  record_access(token: string): AsyncResult<CalendarToken>;

  deactivate_token(token: string): AsyncResult<CalendarToken>;
}
