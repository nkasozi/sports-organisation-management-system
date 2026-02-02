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
} from "../../core/interfaces/adapters/CalendarTokenRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
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

export class InBrowserCalendarTokenRepository
  extends InBrowserBaseRepository<
    CalendarToken,
    CreateCalendarTokenInput,
    UpdateCalendarTokenInput
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

  async find_by_filter(
    filter: CalendarTokenFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    try {
      let filtered_tokens = await this.database.calendar_tokens.toArray();

      if (filter.user_id) {
        filtered_tokens = filtered_tokens.filter(
          (token) => token.user_id === filter.user_id,
        );
      }

      if (filter.organization_id) {
        filtered_tokens = filtered_tokens.filter(
          (token) => token.organization_id === filter.organization_id,
        );
      }

      if (filter.feed_type) {
        filtered_tokens = filtered_tokens.filter(
          (token) => token.feed_type === filter.feed_type,
        );
      }

      if (filter.entity_id) {
        filtered_tokens = filtered_tokens.filter(
          (token) => token.entity_id === filter.entity_id,
        );
      }

      if (filter.is_active !== undefined) {
        filtered_tokens = filtered_tokens.filter(
          (token) => token.is_active === filter.is_active,
        );
      }

      const total_count = filtered_tokens.length;
      const sorted_tokens = this.apply_sort(filtered_tokens, options);
      const paginated_tokens = this.apply_pagination(sorted_tokens, options);

      return create_success_result(
        this.create_paginated_result(paginated_tokens, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter calendar tokens: ${error_message}`,
      );
    }
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
    return this.find_by_filter({ user_id, is_active: true }, options);
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    return this.find_by_filter({ organization_id, is_active: true }, options);
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

export function create_default_calendar_tokens(): CalendarToken[] {
  const now = new Date().toISOString();

  return [
    {
      id: "cal_token_default_1",
      token: "sample_token_abc123def456",
      user_id: "user_default_1",
      organization_id: "org_default_1",
      feed_type: "all",
      entity_id: null,
      entity_name: null,
      reminder_minutes_before: 30,
      is_active: true,
      last_accessed_at: null,
      access_count: 0,
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserCalendarTokenRepository | null = null;

export function get_calendar_token_repository(): CalendarTokenRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserCalendarTokenRepository();
  }
  return singleton_instance;
}

export async function initialize_calendar_token_repository(): Promise<void> {
  const repository =
    get_calendar_token_repository() as InBrowserCalendarTokenRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_calendar_tokens());
  }
}

export async function reset_calendar_token_repository(): Promise<void> {
  const repository =
    get_calendar_token_repository() as InBrowserCalendarTokenRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_calendar_tokens());
}
