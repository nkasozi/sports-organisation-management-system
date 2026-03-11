import type { Table } from "dexie";
import type {
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
} from "../../core/entities/CalendarToken";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CalendarTokenRepository,
  CalendarTokenFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "cal_token";

class InBrowserCalendarTokenRepository
  extends InBrowserBaseRepository<
    CalendarToken,
    CreateCalendarTokenInput,
    UpdateCalendarTokenInput,
    CalendarTokenFilter
  >
  implements CalendarTokenRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<CalendarToken, string> {
    return this.database.calendar_tokens;
  }

  protected create_entity_from_input(
    input: CreateCalendarTokenInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): CalendarToken {
    return {
      id,
      ...timestamps,
      ...input,
      last_accessed_at: null,
      access_count: 0,
    };
  }

  protected apply_updates_to_entity(
    entity: CalendarToken,
    updates: UpdateCalendarTokenInput,
  ): CalendarToken {
    return {
      ...entity,
      ...updates,
    };
  }

  protected apply_entity_filter(
    entities: CalendarToken[],
    filter: CalendarTokenFilter,
  ): CalendarToken[] {
    let filtered = entities;

    if (filter.user_id) {
      filtered = filtered.filter((token) => token.user_id === filter.user_id);
    }

    if (filter.organization_id) {
      filtered = filtered.filter(
        (token) => token.organization_id === filter.organization_id,
      );
    }

    if (filter.feed_type) {
      filtered = filtered.filter(
        (token) => token.feed_type === filter.feed_type,
      );
    }

    if (filter.entity_id) {
      filtered = filtered.filter(
        (token) => token.entity_id === filter.entity_id,
      );
    }

    if (filter.is_active !== undefined) {
      filtered = filtered.filter(
        (token) => token.is_active === filter.is_active,
      );
    }

    return filtered;
  }

  async find_by_token(token: string): AsyncResult<CalendarToken | null> {
    try {
      const all_tokens = await this.database.calendar_tokens.toArray();
      const found_token = all_tokens.find(
        (t) => t.token === token && t.is_active,
      );
      return create_success_result(found_token ?? null);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to find token: ${error_message}`);
    }
  }

  async find_by_user(
    user_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    return this.find_all({ user_id, is_active: true }, options);
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    return this.find_all({ organization_id, is_active: true }, options);
  }

  async record_access(token: string): AsyncResult<CalendarToken> {
    try {
      const all_tokens = await this.database.calendar_tokens.toArray();
      const found_token = all_tokens.find((t) => t.token === token);

      if (!found_token) {
        return create_failure_result("Token not found");
      }

      const updated_token: CalendarToken = {
        ...found_token,
        last_accessed_at: new Date().toISOString(),
        access_count: found_token.access_count + 1,
        updated_at: new Date().toISOString(),
      };

      await this.database.calendar_tokens.put(updated_token);
      return create_success_result(updated_token);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to record access: ${error_message}`);
    }
  }

  async deactivate_token(token: string): AsyncResult<CalendarToken> {
    try {
      const all_tokens = await this.database.calendar_tokens.toArray();
      const found_token = all_tokens.find((t) => t.token === token);

      if (!found_token) {
        return create_failure_result("Token not found");
      }

      const updated_token: CalendarToken = {
        ...found_token,
        is_active: false,
        updated_at: new Date().toISOString(),
      };

      await this.database.calendar_tokens.put(updated_token);
      return create_success_result(updated_token);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to deactivate token: ${error_message}`,
      );
    }
  }
}

let singleton_instance: InBrowserCalendarTokenRepository | null = null;

export function get_calendar_token_repository(): CalendarTokenRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserCalendarTokenRepository();
  }
  return singleton_instance;
}
