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
import type { CalendarTokenFilter } from "../../external/repositories/CalendarTokenRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

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
    user_id: EntityId,
    organization_id: EntityId,
    feed_type: CalendarFeedType,
    entity_id: CalendarFeedEntityId | null,
    entity_name: CalendarToken["entity_name"],
    reminder_minutes_before?: number,
  ): AsyncResult<CalendarFeedInfo>;

  list_user_feeds(
    user_id: EntityId,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken>;

  get_feed_by_token(
    token: CalendarTokenValue,
  ): AsyncResult<CalendarToken | null>;

  revoke_feed(token: CalendarTokenValue): AsyncResult<CalendarToken>;

  update_feed_settings(
    token: CalendarTokenValue,
    reminder_minutes_before: number,
  ): AsyncResult<CalendarToken>;

  record_feed_access(token: CalendarTokenValue): AsyncResult<CalendarToken>;
}
