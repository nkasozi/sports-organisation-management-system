import type {
  CalendarFeedType,
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
} from "../../../../entities/CalendarToken";
import type {
  CalendarFeedEntityId,
  CalendarTokenValue,
  EntityId,
} from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

const CALENDAR_TOKEN_NOT_FOUND_ERROR_PREFIX = "Calendar token not found";

export function build_calendar_token_not_found_error(
  token: CalendarTokenValue,
): string {
  return `${CALENDAR_TOKEN_NOT_FOUND_ERROR_PREFIX}: ${token}`;
}

export function is_calendar_token_not_found_error(
  error: string,
  token: CalendarTokenValue,
): boolean {
  return error === build_calendar_token_not_found_error(token);
}

export interface CalendarTokenFilter {
  user_id?: EntityId;
  organization_id?: EntityId;
  feed_type?: CalendarFeedType;
  entity_id?: CalendarFeedEntityId;
  is_active?: boolean;
}

export interface CalendarTokenRepository extends FilterableRepository<
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
  CalendarTokenFilter
> {
  find_by_token(token: CalendarTokenValue): AsyncResult<CalendarToken>;

  find_by_user(
    user_id: EntityId,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken>;

  find_by_organization(
    organization_id: EntityId,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken>;

  record_access(token: CalendarTokenValue): AsyncResult<CalendarToken>;

  deactivate_token(token: CalendarTokenValue): AsyncResult<CalendarToken>;
}
