import type {
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
  CalendarFeedType,
} from "../../entities/CalendarToken";
import type { CalendarTokenFilter } from "../adapters/CalendarTokenRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type {
  BaseUseCasesPort,
  EntityOperationResult,
} from "./BaseUseCasesPort";

export interface CalendarFeedInfo {
  token: CalendarToken;
  https_url: string;
  webcal_url: string;
}

export interface CalendarTokenUseCasesPort extends BaseUseCasesPort<
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
  CalendarTokenFilter
> {
  create_feed(
    user_id: string,
    organization_id: string,
    feed_type: CalendarFeedType,
    entity_id: string | null,
    entity_name: string | null,
    reminder_minutes_before?: number,
  ): Promise<EntityOperationResult<CalendarFeedInfo>>;

  list_user_feeds(
    user_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken>;

  get_feed_by_token(token: string): AsyncResult<CalendarToken | null>;

  revoke_feed(token: string): AsyncResult<CalendarToken>;

  update_feed_settings(
    token: string,
    reminder_minutes_before: number,
  ): AsyncResult<CalendarToken>;

  record_feed_access(token: string): AsyncResult<CalendarToken>;
}
